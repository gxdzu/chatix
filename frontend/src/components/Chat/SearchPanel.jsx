import { useState, useCallback } from 'react';
import api from '../../utils/api';
import { formatDate, formatTime } from '../../utils/format';

export default function SearchPanel({ chatId, onClose, onJump }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useState(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${chatId}/search?q=${encodeURIComponent(q)}`);
      setResults(data.messages);
    } catch {} finally {
      setLoading(false);
    }
  }, [chatId]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef[0]);
    debounceRef[0] = setTimeout(() => search(val), 400);
  };

  const highlight = (text, q) => {
    if (!text || !q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase()
        ? <mark key={i} style={{ background: 'var(--purple-light)', color: 'var(--purple)', borderRadius: 3 }}>{p}</mark>
        : p
    );
  };

  return (
    <div style={{ width: 280, borderLeft: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Поиск по сообщениям</span>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18 }}>✕</button>
        </div>
        <input
          className="input-field"
          placeholder="Введите запрос..."
          value={query}
          onChange={handleChange}
          autoFocus
          style={{ fontSize: 13 }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Ищем...</div>}
        {!loading && query.length > 1 && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Ничего не найдено</div>
        )}
        {results.map(msg => (
          <div
            key={msg.id}
            onClick={() => onJump(msg)}
            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--purple)' }}>{msg.sender?.display_name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDate(msg.created_at)} {formatTime(msg.created_at)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {highlight(msg.content, query)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
