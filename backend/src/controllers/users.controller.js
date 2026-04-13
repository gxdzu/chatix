const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      'SELECT id, username, display_name, avatar_url, bio, last_seen, role FROM users WHERE id = $1 AND status = $2',
      [userId, 'active']
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { display_name, bio, avatar_url } = req.body;
    const result = await query(
      `UPDATE users SET
        display_name = COALESCE($1, display_name),
        bio = COALESCE($2, bio),
        avatar_url = COALESCE($3, avatar_url),
        updated_at = NOW()
       WHERE id = $4 RETURNING id, username, display_name, bio, avatar_url, email, role`,
      [display_name, bio, avatar_url, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Password changed. Please log in again.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateLastSeen = async (userId) => {
  await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]).catch(() => {});
};

exports.getSessions = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, device_info, created_at, expires_at FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await query('DELETE FROM refresh_tokens WHERE id = $1 AND user_id = $2', [sessionId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
