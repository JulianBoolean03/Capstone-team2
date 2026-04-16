const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../auth');
const { toPublicUser } = require('./auth');

const router = express.Router();

router.post('/request', requireAuth, async (req, res) => {
  try {
    const receiverId = String(req.body.receiverId || '');
    if (!receiverId || receiverId === req.userId) {
      return res.status(400).json({ error: 'Invalid receiver.' });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found.' });
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

    // If they already sent us a request, auto-accept
    const reverse = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: req.userId } },
    });
    if (reverse?.status === 'pending') {
      const [a, b] = [req.userId, receiverId].sort();
      await prisma.$transaction([
        prisma.friendRequest.update({ where: { id: reverse.id }, data: { status: 'accepted' } }),
        prisma.friendship.upsert({
          where: { userAId_userBId: { userAId: a, userBId: b } },
          create: { userAId: a, userBId: b },
          update: {},
        }),
      ]);
      return res.status(201).json({ accepted: true });
    }

    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: req.userId, receiverId } },
    });
    if (existing?.status === 'pending') {
      return res.status(409).json({ error: 'Request already sent.' });
    }

    const request = existing
      ? await prisma.friendRequest.update({ where: { id: existing.id }, data: { status: 'pending' } })
      : await prisma.friendRequest.create({ data: { senderId: req.userId, receiverId } });

    return res.status(201).json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to send friend request.' });
  }
});

router.get('/requests', requireAuth, async (req, res) => {
  try {
    const [incoming, outgoing, friendships] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: req.userId, status: 'pending' },
        include: { sender: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: req.userId, status: 'pending' },
        include: { receiver: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
        include: { userA: true, userB: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      incoming: incoming.map((r) => ({ id: r.id, sender: toPublicUser(r.sender), createdAt: r.createdAt })),
      outgoing: outgoing.map((r) => ({ id: r.id, receiver: toPublicUser(r.receiver), createdAt: r.createdAt })),
      friends: friendships.map((f) => {
        const friend = f.userAId === req.userId ? f.userB : f.userA;
        return { id: friend.id, fullName: friend.fullName, email: friend.email, connectedAt: f.createdAt };
      }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load friend data.' });
  }
});

router.post('/request/:id/respond', requireAuth, async (req, res) => {
  try {
    const action = String(req.body.action || '').toLowerCase();
    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ error: 'Action must be accept or decline.' });
    }

    const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.receiverId !== req.userId || request.status !== 'pending') {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    if (action === 'decline') {
      await prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'declined' } });
      return res.json({ ok: true });
    }

    const [a, b] = [request.senderId, request.receiverId].sort();
    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'accepted' } }),
      prisma.friendship.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: { userAId: a, userBId: b },
        update: {},
      }),
    ]);

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to respond to request.' });
  }
});

module.exports = router;
