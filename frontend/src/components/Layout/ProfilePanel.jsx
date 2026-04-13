import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Avatar from '../UI/Avatar';

export default function ProfilePanel({ onClose }) {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ display_name: user?.display_name || '', bio: user?.bio || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveProfile = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      setMsg('Сохранено!');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Ошибка');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setMsg('Пароли не совпадают'); return; }
    setSaving(true); setMsg('');
    try {
      await api.put('/users/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setMsg('Пароль изменён. Необходимо войти заново.');
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Ошибка');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 16, width: 420, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Профиль</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 22 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <Avatar user={user} size={60} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{user?.display_name}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>@{user?.username}</div>
              {user?.role === 'admin' && <div style={{ fontSize: 11, color: 'var(--purple)', background: 'var(--purple-light)', padding: '2px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>Administrator</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-2)', borderRadius: 10, padding: 4 }}>
            {['profile', 'security'].map(t => (
              <button key={t} onClick={() => { setTab(t); setMsg(''); }}
                style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 13, fontWeight: tab === t ? 600 : 400, background: tab === t ? 'var(--bg)' : 'none', color: tab === t ? 'var(--purple)' : 'var(--text-2)', border: tab === t ? '1px solid var(--border)' : 'none' }}>
                {t === 'profile' ? 'Профиль' : 'Безопасность'}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Отображаемое имя</label>
                <input className="input-field" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>О себе</label>
                <textarea className="input-field" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
              </div>
              {msg && <p style={{ fontSize: 13, color: msg.includes('!') ? '#1D9E75' : '#e24b4a' }}>{msg}</p>}
              <button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</button>
            </div>
          )}

          {tab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Текущий пароль</label>
                <input className="input-field" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Новый пароль</label>
                <input className="input-field" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} minLength={8} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Повторите новый пароль</label>
                <input className="input-field" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              </div>
              {msg && <p style={{ fontSize: 13, color: msg.includes('изменён') ? '#1D9E75' : '#e24b4a' }}>{msg}</p>}
              <button className="btn-primary" onClick={changePassword} disabled={saving}>{saving ? 'Меняем...' : 'Изменить пароль'}</button>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1px solid #e24b4a', color: '#e24b4a', fontSize: 14, fontWeight: 500, marginTop: 8 }}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}
