const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { updateLastSeen } = require('../controllers/users.controller');

const onlineUsers = new Map(); // userId -> Set of socketIds

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        "SELECT id, username, display_name, avatar_url, role FROM users WHERE id = $1 AND status = 'active'",
        [decoded.userId]
      );
      if (!result.rows[0]) return next(new Error('User not found'));
      socket.user = result.rows[0];
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    const userChats = await query(
      'SELECT chat_id FROM chat_members WHERE user_id = $1',
      [userId]
    );
    userChats.rows.forEach(({ chat_id }) => socket.join(`chat:${chat_id}`));

    io.emit('user:online', { userId, online: true });

    socket.on('message:send', async (data, ack) => {
      try {
        const { chatId, content, type = 'text', replyToId, fileUrl, fileName, fileSize, mimeType, duration } = data;

        const isMember = await query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, userId]
        );
        if (!isMember.rows[0]) return ack?.({ error: 'Not a member' });

        const result = await query(
          `INSERT INTO messages (chat_id, sender_id, content, type, reply_to_id, file_url, file_name, file_size, mime_type, duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [chatId, userId, content, type, replyToId || null, fileUrl || null, fileName || null, fileSize || null, mimeType || null, duration || null]
        );
        const msg = result.rows[0];

        let replyTo = null;
        if (replyToId) {
          const r = await query(
            'SELECT m.id, m.content, u.display_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1',
            [replyToId]
          );
          if (r.rows[0]) replyTo = { id: r.rows[0].id, content: r.rows[0].content, sender: { display_name: r.rows[0].display_name } };
        }

        const payload = {
          ...msg,
          sender: {
            id: socket.user.id,
            username: socket.user.username,
            display_name: socket.user.display_name,
            avatar_url: socket.user.avatar_url,
          },
          reactions: [],
          reply_to: replyTo,
        };

        io.to(`chat:${chatId}`).emit('message:new', payload);
        ack?.({ success: true, message: payload });
      } catch (err) {
        console.error('message:send error', err);
        ack?.({ error: 'Failed to send' });
      }
    });

    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;
        const msg = await query(
          'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
          [messageId, userId]
        );
        if (!msg.rows[0]) return;
        const updated = await query(
          'UPDATE messages SET content = $1, is_edited = true, edited_at = NOW() WHERE id = $2 RETURNING *',
          [content, messageId]
        );
        io.to(`chat:${updated.rows[0].chat_id}`).emit('message:edited', {
          messageId,
          content,
          edited_at: updated.rows[0].edited_at,
        });
      } catch (err) {
        console.error('message:edit error', err);
      }
    });

    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;
        const msg = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (!msg.rows[0]) return;
        if (msg.rows[0].sender_id !== userId && socket.user.role !== 'admin') return;
        await query('UPDATE messages SET is_deleted = true, content = NULL WHERE id = $1', [messageId]);
        io.to(`chat:${msg.rows[0].chat_id}`).emit('message:deleted', { messageId, chatId: msg.rows[0].chat_id });
      } catch (err) {
        console.error('message:delete error', err);
      }
    });

    socket.on('reaction:toggle', async (data) => {
      try {
        const { messageId, emoji } = data;
        const msg = await query('SELECT chat_id FROM messages WHERE id = $1', [messageId]);
        if (!msg.rows[0]) return;
        const existing = await query(
          'SELECT id FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
          [messageId, userId, emoji]
        );
        if (existing.rows[0]) {
          await query('DELETE FROM reactions WHERE id = $1', [existing.rows[0].id]);
        } else {
          await query('INSERT INTO reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)', [messageId, userId, emoji]);
        }
        const reactions = await query(
          `SELECT emoji, COUNT(*) as count, array_agg(user_id) as user_ids
           FROM reactions WHERE message_id = $1 GROUP BY emoji`,
          [messageId]
        );
        io.to(`chat:${msg.rows[0].chat_id}`).emit('reaction:updated', {
          messageId,
          reactions: reactions.rows,
        });
      } catch (err) {
        console.error('reaction:toggle error', err);
      }
    });

    socket.on('typing:start', (data) => {
      socket.to(`chat:${data.chatId}`).emit('typing:start', {
        chatId: data.chatId,
        userId,
        display_name: socket.user.display_name,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`chat:${data.chatId}`).emit('typing:stop', { chatId: data.chatId, userId });
    });

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await updateLastSeen(userId);
          io.emit('user:online', { userId, online: false });
        }
      }
    });
  });
};
