const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.userId },
      include: {
        conversation: {
          include: {
            members: { include: { user: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    const conversations = memberships.map(({ conversation }) => {
      const otherMembers = conversation.members
        .filter((m) => m.userId !== req.userId)
        .map((m) => ({ id: m.user.id, fullName: m.user.fullName, email: m.user.email }));
      const lastMessage = conversation.messages[0] || null;
      return {
        id: conversation.id,
        otherMembers,
        lastMessage: lastMessage
          ? { text: lastMessage.text, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
          : null,
        createdAt: conversation.createdAt,
      };
    });

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return res.json({ conversations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load conversations.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const otherUserId = String(req.body.otherUserId || '');
    if (!otherUserId || otherUserId === req.userId) {
      return res.status(400).json({ error: 'Invalid user.' });
    }

    // Reuse existing 1-on-1 conversation if it exists
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.userId },
      include: { conversation: { include: { members: true } } },
    });

    for (const { conversation } of memberships) {
      const memberIds = conversation.members.map((m) => m.userId);
      if (memberIds.length === 2 && memberIds.includes(otherUserId)) {
        return res.json({ conversationId: conversation.id });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        members: { create: [{ userId: req.userId }, { userId: otherUserId }] },
      },
    });

    return res.status(201).json({ conversationId: conversation.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to create conversation.' });
  }
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: req.params.id, userId: req.userId } },
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this conversation.' });

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    return res.json({ messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load messages.' });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required.' });

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: req.params.id, userId: req.userId } },
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this conversation.' });

    const message = await prisma.message.create({
      data: { conversationId: req.params.id, senderId: req.userId, text },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to send message.' });
  }
});

module.exports = router;
