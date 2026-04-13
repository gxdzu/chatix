import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const device = navigator.userAgent.slice(0, 100);
      await login(form.login, form.password, device);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 360, padding: '40px 32px', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>💬</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Чатикс</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 4, fontSize: 14 }}>Войди в свой аккаунт</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" placeholder="Логин или email" value={form.login} onChange={e => setForm(f => ({...f, login: e.target.value}))} required />
          <input className="input-field" type="password" placeholder="Пароль" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          {error && <p style={{ color: '#e24b4a', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-2)', fontSize: 14 }}>
          Нет аккаунта? <Link to="/register" style={{ color: 'var(--purple)' }}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
