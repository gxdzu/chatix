require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/chats', apiLimiter, require('./routes/chats.routes'));
app.use('/api/messages', apiLimiter, require('./routes/messages.routes'));
app.use('/api/admin', apiLimiter, require('./routes/admin.routes'));
app.use('/api/users', apiLimiter, require('./routes/users.routes'));
app.use('/api/upload', apiLimiter, require('./routes/upload.routes'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

require('./socket')(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Chatix backend running on port ${PORT}`));

module.exports = { app, server };
