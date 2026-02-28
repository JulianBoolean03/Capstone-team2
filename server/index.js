const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const { prisma } = require('./db');
const { signToken, requireAuth } = require('./auth');
const { computeMatch } = require('./recommendation');
const { sanitizeMessageContent } = require('./sanitizer');

// Expo SDK will be dynamically imported when needed for push notifications
let expoClient = null;
const initExpoClient = async () => {
  if (!expoClient) {
    const { Expo } = await import('expo-server-sdk');
    expoClient = new Expo();
  }
  return expoClient;
};

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

// ─── Socket.io JWT Authentication Middleware ──────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Missing auth token'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.sub;
    socket.selectedConversationId = null; // Track which conversation the user is viewing
    return next();
  } catch (err) {
    return next(new Error('Invalid auth token'));
  }
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'StudyApp API',
    endpoints: ['/health', '/auth/signup', '/auth/login'],
  });
});

function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    quizCompleted: user.quizCompleted,
    quizAnswers: user.quizAnswers || null,
    avatarBgColor: user.avatarBgColor,
    avatarTextColor: user.avatarTextColor,
    createdAt: user.createdAt,
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/signup', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must have at least 6 characters.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
      },
    });

    const token = signToken(user.id);
    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to sign up right now.' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user.id);
    return res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to login right now.' });
  }
});

app.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch user profile.' });
  }
});

app.post('/quiz/submit', requireAuth, async (req, res) => {
  try {
    const answers = req.body.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ error: 'Quiz answers must be an object.' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        quizCompleted: true,
        quizAnswers: answers,
      },
    });

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to save quiz answers.' });
  }
});

app.get('/discover', requireAuth, async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!current) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const others = await prisma.user.findMany({
      where: {
        id: { not: req.userId },
        quizCompleted: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: req.userId }, { userBId: req.userId }],
      },
    });

    const friendIds = new Set();
    for (const f of friendships) {
      friendIds.add(f.userAId === req.userId ? f.userBId : f.userAId);
    }

    const pending = await prisma.friendRequest.findMany({
      where: {
        status: 'pending',
        OR: [{ senderId: req.userId }, { receiverId: req.userId }],
      },
    });

    const pendingByOther = new Map();
    for (const r of pending) {
      const otherId = r.senderId === req.userId ? r.receiverId : r.senderId;
      pendingByOther.set(otherId, r);
    }

    const cards = others
      .map((candidate) => {
        const { score } = computeMatch(current.quizAnswers || {}, candidate.quizAnswers || {});
        const relation = friendIds.has(candidate.id)
          ? 'friends'
          : pendingByOther.has(candidate.id)
            ? pendingByOther.get(candidate.id).senderId === req.userId
              ? 'request_sent'
              : 'request_received'
            : 'none';

        return {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.email,
          matchPct: score,
          relation,
          requestId: pendingByOther.get(candidate.id)?.id || null,
        };
      })
      .sort((a, b) => b.matchPct - a.matchPct);

    return res.json({ students: cards });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load recommendations.' });
  }
});

app.post('/friends/request', requireAuth, async (req, res) => {
  try {
    const receiverId = String(req.body.receiverId || '');

    if (!receiverId || receiverId === req.userId) {
      return res.status(400).json({ error: 'Invalid receiver.' });
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: req.userId, userBId: receiverId },
          { userAId: receiverId, userBId: req.userId },
        ],
      },
    });

    if (existingFriendship) {
      return res.status(409).json({ error: 'You are already connected.' });
    }

    const reverse = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: receiverId,
          receiverId: req.userId,
        },
      },
    });

    if (reverse && reverse.status === 'pending') {
      const [a, b] = [req.userId, receiverId].sort();
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: reverse.id },
          data: { status: 'accepted' },
        }),
        prisma.friendship.create({
          data: { userAId: a, userBId: b },
        }),
      ]);

      return res.status(201).json({ accepted: true });
    }

    const existing = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: req.userId,
          receiverId,
        },
      },
    });

    if (existing && existing.status === 'pending') {
      return res.status(409).json({ error: 'Request already sent.' });
    }

    const request = existing
      ? await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: 'pending' },
      })
      : await prisma.friendRequest.create({
        data: {
          senderId: req.userId,
          receiverId,
        },
      });

    return res.status(201).json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to send friend request.' });
  }
});

app.get('/friends/requests', requireAuth, async (req, res) => {
  try {
    const incoming = await prisma.friendRequest.findMany({
      where: {
        receiverId: req.userId,
        status: 'pending',
      },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const outgoing = await prisma.friendRequest.findMany({
      where: {
        senderId: req.userId,
        status: 'pending',
      },
      include: {
        receiver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: req.userId }, { userBId: req.userId }],
      },
      include: {
        userA: true,
        userB: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      incoming: incoming.map((r) => ({
        id: r.id,
        sender: toPublicUser(r.sender),
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.map((r) => ({
        id: r.id,
        receiver: toPublicUser(r.receiver),
        createdAt: r.createdAt,
      })),
      friends: friendships.map((f) => {
        const friend = f.userAId === req.userId ? f.userB : f.userA;
        return {
          id: friend.id,
          fullName: friend.fullName,
          email: friend.email,
          avatarBgColor: friend.avatarBgColor,
          avatarTextColor: friend.avatarTextColor,
          connectedAt: f.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load friend data.' });
  }
});

app.post('/friends/request/:id/respond', requireAuth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const action = String(req.body.action || '').toLowerCase();

    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ error: 'Action must be accept or decline.' });
    }

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });

    if (!request || request.receiverId !== req.userId || request.status !== 'pending') {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    if (action === 'decline') {
      await prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: 'declined' },
      });
      return res.json({ ok: true });
    }

    const [a, b] = [request.senderId, request.receiverId].sort();

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: 'accepted' },
      }),
      prisma.friendship.upsert({
        where: {
          userAId_userBId: {
            userAId: a,
            userBId: b,
          },
        },
        create: {
          userAId: a,
          userBId: b,
        },
        update: {},
      }),
    ]);

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to respond to request.' });
  }
});

// ─── CHAT API ENDPOINTS ────────────────────────────────────────────────────

// GET /conversations — list all conversations for the logged-in user
app.get('/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: req.userId },
          { userBId: req.userId },
        ],
      },
      include: {
        userA: true,
        userB: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.userAId === req.userId ? conv.userB : conv.userA;
        const lastMessage = conv.messages[0];

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: req.userId },
            readAt: null,
          },
        });

        return {
          id: conv.id,
          otherUser: toPublicUser(otherUser),
          lastMessage: lastMessage
            ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              readAt: lastMessage.readAt,
            }
            : null,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
    );

    return res.json({ conversations: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load conversations.' });
  }
});

// GET /conversations/:conversationId/messages — fetch last 100 messages
app.get('/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify requester is a participant
    if (conversation.userAId !== req.userId && conversation.userBId !== req.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load messages.' });
  }
});

// GET /conversations/:conversationId — get single conversation with otherUser details
app.get('/conversations/:conversationId', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify requester is a participant
    if (conversation.userAId !== req.userId && conversation.userBId !== req.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Get the other user's details
    const otherUserId = conversation.userAId === req.userId ? conversation.userBId : conversation.userAId;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, fullName: true },
    });

    return res.json({
      id: conversation.id,
      otherUser,
      lastMessageAt: conversation.lastMessageAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load conversation.' });
  }
});

// PATCH /conversations/:conversationId/read — mark all unread messages as read
app.patch('/conversations/:conversationId/read', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Verify requester is a participant
    if (conversation.userAId !== req.userId && conversation.userBId !== req.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Update all unread messages from the other user
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: req.userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to mark messages as read.' });
  }
});

// POST /conversations — create or retrieve existing conversation
app.post('/conversations', requireAuth, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId || otherUserId === req.userId) {
      return res.status(400).json({ error: 'Invalid otherUserId.' });
    }

    // Verify both users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: req.userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: req.userId },
        ],
      },
    });

    if (!friendship) {
      return res.status(403).json({ error: 'You must be friends to message.' });
    }

    // Upsert conversation with smaller id as userAId
    const [a, b] = [req.userId, otherUserId].sort();

    const conversation = await prisma.conversation.upsert({
      where: {
        userAId_userBId: {
          userAId: a,
          userBId: b,
        },
      },
      create: {
        userAId: a,
        userBId: b,
      },
      update: {},
    });

    return res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to create conversation.' });
  }
});

// POST /users/push-token — update user's push notification token
app.post('/users/push-token', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    // Validate token is a valid Expo push token
    const { Expo } = await import('expo-server-sdk');
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Invalid Expo push token format.' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { pushToken: token },
      select: { id: true, email: true },
    });

    return res.json({ success: true, message: 'Push token updated.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to update push token.' });
  }
});

// POST /users/avatar — update user's avatar colors
app.post('/users/avatar', requireAuth, async (req, res) => {
  try {
    const { bgColor, textColor } = req.body;

    if (!bgColor || !textColor || typeof bgColor !== 'string' || typeof textColor !== 'string') {
      return res.status(400).json({ error: 'Invalid color values.' });
    }

    // Basic hex color validation
    if (!/^#[0-9A-F]{6}$/i.test(bgColor) || !/^#[0-9A-F]{6}$/i.test(textColor)) {
      return res.status(400).json({ error: 'Colors must be valid hex codes.' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        avatarBgColor: bgColor,
        avatarTextColor: textColor,
      },
    });

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to update avatar colors.' });
  }
});

// ─── SOCKET.IO EVENT HANDLERS ──────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket] User ${socket.userId} connected`);

  // Join private room by user ID
  socket.join(socket.userId);

  // send_message event: { conversationId, content }
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content } = data;

      if (!conversationId || !content || typeof content !== 'string') {
        return socket.emit('error', { message: 'Invalid message data.' });
      }

      // Sanitize content
      const sanitized = sanitizeMessageContent(content);
      if (!sanitized) {
        return socket.emit('error', { message: 'Message is empty or too long (max 2000 chars).' });
      }

      // Verify requester is a participant
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found.' });
      }

      if (conversation.userAId !== socket.userId && conversation.userBId !== socket.userId) {
        return socket.emit('error', { message: 'Access denied.' });
      }

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content: sanitized,
          senderId: socket.userId,
          conversationId,
        },
      });

      // Update conversation's lastMessageAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      const fullMessage = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
        readAt: message.readAt,
      };

      // Emit to both users' private rooms
      const otherUserId = conversation.userAId === socket.userId ? conversation.userBId : conversation.userAId;
      io.to(socket.userId).emit('receive_message', fullMessage);
      io.to(otherUserId).emit('receive_message', fullMessage);

      // Send push notification if recipient is offline
      const isRecipientOnline = io.sockets.sockets.has(otherUserId);
      if (!isRecipientOnline) {
        try {
          const recipient = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: { fullName: true, pushToken: true },
          });

          if (recipient && recipient.pushToken) {
            // Get sender's name for notification
            const sender = await prisma.user.findUnique({
              where: { id: socket.userId },
              select: { fullName: true },
            });

            // Create and chunk messages for Expo API
            const message = {
              to: recipient.pushToken,
              sound: 'default',
              title: sender?.fullName || 'StudyApp',
              body: `${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
              data: {
                conversationId,
                senderId: socket.userId,
                messageId: message.id,
              },
            };

            // Initialize Expo client and send notification
            const client = await initExpoClient();
            const tickets = await client.sendPushNotificationsAsync([message]);
            console.log(`[Push] Sent to ${recipient.pushToken}: ${tickets[0].status}`);
          }
        } catch (pushError) {
          console.error('[Push] Error sending notification:', pushError.message);
        }
      }

      console.log(`[Socket] Message from ${socket.userId} in ${conversationId}`);
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Unable to send message.' });
    }
  });

  // mark_read event: { conversationId, messageId }
  socket.on('mark_read', async (data) => {
    try {
      const { conversationId, messageId } = data;

      if (!messageId || !conversationId) {
        return socket.emit('error', { message: 'Invalid messageId or conversationId.' });
      }

      // Verify requester is a participant of the conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found.' });
      }

      if (conversation.userAId !== socket.userId && conversation.userBId !== socket.userId) {
        return socket.emit('error', { message: 'Access denied.' });
      }

      // Verify message belongs to the conversation
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message || message.conversationId !== conversationId) {
        return socket.emit('error', { message: 'Message not found in this conversation.' });
      }

      // Update message readAt
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() },
      });

      // Emit message_read to sender's private room
      io.to(updatedMessage.senderId).emit('message_read', {
        messageId: updatedMessage.id,
        readAt: updatedMessage.readAt,
      });

      console.log(`[Socket] Message ${messageId} marked read by ${socket.userId}`);
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Unable to mark message as read.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User ${socket.userId} disconnected`);
  });

  // Listen when user enters a conversation
  socket.on('conversation:select', (conversationId) => {
    socket.selectedConversationId = conversationId;
    console.log(`[Socket] User ${socket.userId} viewing conversation ${conversationId}`);
  });

  // Listen when user leaves a conversation
  socket.on('conversation:deselect', () => {
    socket.selectedConversationId = null;
    console.log(`[Socket] User ${socket.userId} left conversation`);
  });
});

// Export io for use in other modules
module.exports.io = io;

httpServer.listen(PORT, () => {
  console.log(`API + Socket.io listening on http://localhost:${PORT}`);
});
