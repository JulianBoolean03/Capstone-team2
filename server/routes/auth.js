const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { signToken, requireAuth } = require('../auth');
const { createWelcomeConversation } = require('../bot');

const router = express.Router();

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

router.post('/signup', async (req, res) => {
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
    const user = await prisma.user.create({ data: { fullName, email, passwordHash } });
    const token = signToken(user.id);

    // Fire and forget — don't block signup if this fails
    createWelcomeConversation(user.id).catch(console.error);

    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to sign up right now.' });
  }
});

router.post('/login', async (req, res) => {
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

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch user profile.' });
  }
});

module.exports = { router, toPublicUser };
