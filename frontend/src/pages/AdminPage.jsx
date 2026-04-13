import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Avatar from '../components/UI/Avatar';
import { formatDate } from '../utils/format';

export default function AdminPage() {
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/pending'),
      api.get('/admin/users'),
    ]).then(([p, u]) => {
      setPending(p.data.users);
      setUsers(u.data.users);
    }).finally(() => setLoading(false));
  }, []);

  const approve = async (userId, subgroup) => {
    try {
      await api.post(`/admin/approve/${userId}`, { subgroup });
      setPending(p => p.filter(u => u.id !== userId));
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
      setMsg(`Пользователь одобрен и добавлен в подгруппу ${subgroup}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Ошибка');
    }
  };

  const ban = async (userId) => {
    if (!confirm('Заблокировать пользователя?')) return;
    try {
      await api.post(`/admin/ban/${userId}`);
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
      setMsg('Пользователь заблокирован');
      setTimeout(() => setMsg(''), 3000);
    } catch {}
  };

  const statusColor = { active: '#1D9E75', pending: '#BA7517', banned: '#e24b4a' };
  const statusLabel = { active: 'Активен', pending: 'Ожидание', banned: 'Заблокирован' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link to="/" style={{ color: 'var(--purple)', fontSize: 14 }}>← Назад в чат</Link>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Панель администратора</h1>
        </div>

        {msg && (
          <div style={{ background: 'var(--purple-light)', color: 'var(--purple)', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[['pending', `Заявки (${pending.length})`], ['users', 'Все пользователи']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 14, fontWeight: tab === t ? 600 : 400, background: tab === t ? 'var(--bg)' : 'none', color: tab === t ? 'var(--purple)' : 'var(--text-2)', border: tab === t ? '1px solid var(--border)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Загрузка...</div>}

        {!loading && tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Заявок нет 🎉</div>}
            {pending.map(u => (
              <div key={u.id} style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border)' }}>
                <Avatar user={u} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{u.display_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>@{u.username} · {u.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Зарегистрировался {formatDate(u.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => approve(u.id, 1)} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--purple)', color: 'white', fontSize: 13, fontWeight: 500 }}>Подгруппа 1</button>
                  <button onClick={() => approve(u.id, 2)} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--purple)', color: 'white', fontSize: 13, fontWeight: 500 }}>Подгруппа 2</button>
                  <button onClick={() => approve(u.id, null)} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--bg-3)', color: 'var(--text-2)', fontSize: 13, border: '1px solid var(--border)' }}>Только общий</button>
                  <button onClick={() => ban(u.id)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e24b4a', color: '#e24b4a', fontSize: 13 }}>Отклонить</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {users.map(u => (
              <div key={u.id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)' }}>
                <Avatar user={u} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{u.display_name} {u.role === 'admin' && <span style={{ fontSize: 11, color: 'var(--purple)' }}>admin</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>@{u.username} · {u.email}</div>
                </div>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 8, background: statusColor[u.status] + '22', color: statusColor[u.status] }}>{statusLabel[u.status]}</span>
                {u.role !== 'admin' && u.status !== 'banned' && (
                  <button onClick={() => ban(u.id)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e24b4a', color: '#e24b4a', fontSize: 12 }}>Бан</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
