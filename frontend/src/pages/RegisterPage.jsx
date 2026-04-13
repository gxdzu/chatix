import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', display_name: '', email: '', password: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ marginBottom: 8 }}>Заявка отправлена</h2>
        <p style={{ color: 'var(--text-2)' }}>Ждём одобрения от администратора.<br/>Как только тебя одобрят — сможешь войти.</p>
        <Link to="/login" style={{ display: 'block', marginTop: 24, color: 'var(--purple)' }}>Перейти к входу</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 380, padding: '40px 32px', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Регистрация</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>После регистрации нужно одобрение администратора</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" placeholder="Имя пользователя (латиница, 3-32 символа)" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]+" title="Только латиница, цифры и _" />
          <input className="input-field" placeholder="Отображаемое имя" value={form.display_name} onChange={e => setForm(f => ({...f, display_name: e.target.value}))} required />
          <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          <input className="input-field" type="password" placeholder="Пароль (мин. 8 символов)" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required minLength={8} />
          {error && <p style={{ color: '#e24b4a', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Отправляем...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-2)', fontSize: 14 }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--purple)' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
