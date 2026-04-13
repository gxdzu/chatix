const { query } = require('../config/db');

exports.getPendingUsers = async (req, res) => {
  try {
    const result = await query(
      "SELECT id, username, display_name, email, created_at FROM users WHERE status = 'pending' ORDER BY created_at",
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subgroup } = req.body;

    const user = await query(
      "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
      [userId]
    );
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });

    const general = await query("SELECT id FROM chats WHERE type = 'general' LIMIT 1");
    if (general.rows[0]) {
      await query(
        'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [general.rows[0].id, userId]
      );
    }

    if (subgroup === 1 || subgroup === 2) {
      const sub = await query(
        "SELECT id FROM chats WHERE type = 'subgroup' AND subgroup_number = $1 LIMIT 1",
        [subgroup]
      );
      if (sub.rows[0]) {
        await query(
          'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [sub.rows[0].id, userId]
        );
      }
    }

    res.json({ message: 'User approved', user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await query(
      "UPDATE users SET status = 'banned', updated_at = NOW() WHERE id = $1",
      [userId]
    );
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    res.json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, display_name, email, status, role, last_seen, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
