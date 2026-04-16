const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const discoverRoutes = require('./routes/discover');
const friendRoutes = require('./routes/friends');
const conversationRoutes = require('./routes/conversations');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, service: 'StudyStack API' }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes.router);
app.use('/quiz', quizRoutes);
app.use('/discover', discoverRoutes);
app.use('/friends', friendRoutes);
app.use('/conversations', conversationRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
