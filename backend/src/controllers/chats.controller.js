const { query } = require('../config/db');

exports.getMyChats = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.type, c.subgroup_number,
        (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) AS member_count,
        (SELECT json_build_object('id', m.id, 'content', m.content, 'type', m.type,
          'created_at', m.created_at, 'is_deleted', m.is_deleted,
          'sender', json_build_object('display_name', u.display_name))
         FROM messages m JOIN users u ON m.sender_id = u.id
         WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*) FROM messages m2
         LEFT JOIN read_receipts rr ON rr.chat_id = m2.chat_id AND rr.user_id = $1
         WHERE m2.chat_id = c.id AND m2.is_deleted = false
         AND (rr.last_read_message_id IS NULL OR m2.created_at > (
           SELECT created_at FROM messages WHERE id = rr.last_read_message_id
         )) AND m2.sender_id != $1) AS unread_count
       FROM chats c
       JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = $1
       ORDER BY CASE c.type WHEN 'general' THEN 1 WHEN 'subgroup' THEN 2 ELSE 3 END, c.created_at`,
      [req.user.id]
    );
    res.json({ chats: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getChatMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const isMember = await query(
      'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );
    if (!isMember.rows[0]) return res.status(403).json({ error: 'Not a member' });

    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.role, u.last_seen, u.status
       FROM users u JOIN chat_members cm ON cm.user_id = u.id
       WHERE cm.chat_id = $1 AND u.status = 'active'
       ORDER BY u.display_name`,
      [chatId]
    );
    res.json({ members: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createDirect = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const existing = await query(
      `SELECT c.id FROM chats c
       JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = $1
       JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = $2
       WHERE c.type = 'direct'`,
      [req.user.id, targetUserId]
    );
    if (existing.rows[0]) return res.json({ chat: existing.rows[0] });

    const target = await query('SELECT display_name FROM users WHERE id = $1', [targetUserId]);
    if (!target.rows[0]) return res.status(404).json({ error: 'User not found' });

    const chat = await query(
      "INSERT INTO chats (type, created_by) VALUES ('direct', $1) RETURNING *",
      [req.user.id]
    );
    await query(
      'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chat.rows[0].id, req.user.id, targetUserId]
    );
    res.json({ chat: chat.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageId } = req.body;
    await query(
      `INSERT INTO read_receipts (chat_id, user_id, last_read_message_id, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (chat_id, user_id) DO UPDATE SET last_read_message_id = $3, updated_at = NOW()`,
      [chatId, req.user.id, messageId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
