const { prisma } = require('./db');

const BOT_EMAIL = 'bot@studystack.app';
const BOT_NAME = 'Study Stack';

const WELCOME_MESSAGES = [
  'Welcome to Study Stack! 👋',
  'This is your space to connect with study partners who match your learning style.',
  'Head over to the Discover tab to find students with similar study habits and courses.',
  'Once you add friends, you can start chats with them right here. Good luck! 📚',
];

async function getBotUser() {
  let bot = await prisma.user.findUnique({ where: { email: BOT_EMAIL } });

  if (!bot) {
    bot = await prisma.user.create({
      data: {
        fullName: BOT_NAME,
        email: BOT_EMAIL,
        passwordHash: 'not-a-real-password',
        quizCompleted: true,
        quizAnswers: {},
      },
    });
  }

  return bot;
}

async function createWelcomeConversation(userId) {
  const bot = await getBotUser();

  // Check if welcome conversation already exists
  const existing = await prisma.conversationMember.findMany({
    where: { userId },
    include: { conversation: { include: { members: true } } },
  });

  for (const { conversation } of existing) {
    const memberIds = conversation.members.map((m) => m.userId);
    if (memberIds.includes(bot.id)) return;
  }

  // Create conversation + seed messages
  const conversation = await prisma.conversation.create({
    data: {
      members: { create: [{ userId }, { userId: bot.id }] },
    },
  });

  for (const text of WELCOME_MESSAGES) {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderId: bot.id, text },
    });
  }
}

module.exports = { createWelcomeConversation };
