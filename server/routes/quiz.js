const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../auth');
const { toPublicUser } = require('./auth');

const router = express.Router();

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const answers = req.body.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ error: 'Quiz answers must be an object.' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { quizCompleted: true, quizAnswers: answers },
    });

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to save quiz answers.' });
  }
});

module.exports = router;
