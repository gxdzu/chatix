require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chatix.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists, skipping seed');
      return;
    }

    const hash = await bcrypt.hash(adminPassword, 12);
    await client.query('BEGIN');

    const admin = await client.query(
      `INSERT INTO users (username, display_name, email, password_hash, status, role)
       VALUES ('admin', 'Admin', $1, $2, 'active', 'admin') RETURNING id`,
      [adminEmail, hash]
    );
    const adminId = admin.rows[0].id;

    const general = await client.query(
      `INSERT INTO chats (name, type, created_by) VALUES ('Общий чат', 'general', $1) RETURNING id`,
      [adminId]
    );
    const sub1 = await client.query(
      `INSERT INTO chats (name, type, subgroup_number, created_by) VALUES ('Подгруппа 1', 'subgroup', 1, $1) RETURNING id`,
      [adminId]
    );
    const sub2 = await client.query(
      `INSERT INTO chats (name, type, subgroup_number, created_by) VALUES ('Подгруппа 2', 'subgroup', 2, $1) RETURNING id`,
      [adminId]
    );

    for (const chat of [general, sub1, sub2]) {
      await client.query(
        'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)',
        [chat.rows[0].id, adminId]
      );
    }

    await client.query('COMMIT');
    console.log(`Seed complete. Admin: ${adminEmail}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err.message);
  } finally {
    client.release();
  }
}

seed().then(() => process.exit(0)).catch(() => process.exit(1));
