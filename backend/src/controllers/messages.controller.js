const { query } = require('../config/db');

const MESSAGE_FIELDS = `
  m.id, m.chat_id, m.content, m.type, m.file_url, m.file_name, m.file_size,
  m.mime_type, m.duration, m.is_edited, m.is_deleted, m.created_at, m.edited_at,
  m.reply_to_id,
  json_build_object('id', u.id, 'username', u.username, 'display_name', u.display_name, 'avatar_url', u.avatar_url) AS sender,
  COALESCE(
    (SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.cnt, 'user_ids', r.user_ids))
     FROM (
       SELECT emoji, COUNT(*) as cnt, array_agg(user_id) as user_ids
       FROM reactions WHERE message_id = m.id GROUP BY emoji
     ) r), '[]'
  ) AS reactions,
  CASE WHEN m.reply_to_id IS NOT NULL THEN
    (SELECT json_build_object('id', rm.id, 'content', rm.content,
      'sender', json_build_object('display_name', ru.display_name))
     FROM messages rm JOIN users ru ON rm.sender_id = ru.id WHERE rm.id = m.reply_to_id)
  END AS reply_to
`;

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { before, limit = 50 } = req.query;

    const isMember = await query(
      'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );
    if (!isMember.rows[0]) return res.status(403).json({ error: 'Not a member' });

    let sql = `SELECT ${MESSAGE_FIELDS} FROM messages m
               JOIN users u ON m.sender_id = u.id
               WHERE m.chat_id = $1`;
    const params = [chatId];

    if (before) {
      params.push(before);
      sql += ` AND m.created_at < $${params.length}`;
    }
    sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(parseInt(limit), 100));

    const result = await query(sql, params);
    res.json({ messages: result.rows.reverse() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ messages: [] });

    const isMember = await query(
      'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );
    if (!isMember.rows[0]) return res.status(403).json({ error: 'Not a member' });

    const result = await query(
      `SELECT ${MESSAGE_FIELDS} FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1 AND m.is_deleted = false
       AND m.content ILIKE $2
       ORDER BY m.created_at DESC LIMIT 50`,
      [chatId, `%${q}%`]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const msg = await query(
      'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
      [messageId, req.user.id]
    );
    if (!msg.rows[0]) return res.status(404).json({ error: 'Message not found' });
    const result = await query(
      'UPDATE messages SET content = $1, is_edited = true, edited_at = NOW() WHERE id = $2 RETURNING *',
      [content, messageId]
    );
    res.json({ message: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
    if (!msg.rows[0]) return res.status(404).json({ error: 'Not found' });
    const canDelete = msg.rows[0].sender_id === req.user.id || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });
    await query(
      'UPDATE messages SET is_deleted = true, content = NULL WHERE id = $1',
      [messageId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const existing = await query(
      'SELECT id FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, req.user.id, emoji]
    );
    if (existing.rows[0]) {
      await query('DELETE FROM reactions WHERE id = $1', [existing.rows[0].id]);
      return res.json({ removed: true });
    }
    await query(
      'INSERT INTO reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
      [messageId, req.user.id, emoji]
    );
    res.json({ added: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
