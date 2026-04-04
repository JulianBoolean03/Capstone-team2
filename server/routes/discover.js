const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../auth');
const { computeMatch } = require('../recommendation');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!current) return res.status(404).json({ error: 'User not found.' });

    const [others, friendships, pending] = await Promise.all([
      prisma.user.findMany({
        where: { id: { not: req.userId }, quizCompleted: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
      }),
      prisma.friendRequest.findMany({
        where: { status: 'pending', OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
      }),
    ]);

    const friendIds = new Set(
      friendships.map((f) => (f.userAId === req.userId ? f.userBId : f.userAId))
    );

    const pendingByOther = new Map();
    for (const r of pending) {
      const otherId = r.senderId === req.userId ? r.receiverId : r.senderId;
      pendingByOther.set(otherId, r);
    }

    const cards = others
      .map((candidate) => {
        const { score } = computeMatch(current.quizAnswers || {}, candidate.quizAnswers || {});
        const pendingReq = pendingByOther.get(candidate.id);
        const relation = friendIds.has(candidate.id)
          ? 'friends'
          : pendingReq
            ? pendingReq.senderId === req.userId
              ? 'request_sent'
              : 'request_received'
            : 'none';

        return {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.email,
          matchPct: score,
          relation,
          requestId: pendingReq?.id || null,
        };
      })
      .sort((a, b) => b.matchPct - a.matchPct);

    return res.json({ students: cards });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load recommendations.' });
  }
});

module.exports = router;
