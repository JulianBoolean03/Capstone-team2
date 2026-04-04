const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const { prisma } = require('./db');
const { signToken, requireAuth } = require('./auth');
const { computeMatch } = require('./recommendation');

const app = express();
const PORT = Number(process.env.PORT || 4000);
console.log(`process.env.PORT = ${process.env.PORT}, using PORT = ${PORT}`);

app.use(cors());
app.use(express.json());

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${PORT} (0.0.0.0)`);
});
