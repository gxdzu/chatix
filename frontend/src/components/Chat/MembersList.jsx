import { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { formatLastSeen } from '../../utils/format';
import api from '../../utils/api';
import Avatar from '../UI/Avatar';

export default function MembersList({ chatId, onClose }) {
  const [members, setMembers] = useState([]);
  const onlineUsers = useChatStore(s => s.onlineUsers);
  const currentUser = useAuthStore(s => s.user);
  const { chats, setChats } = useChatStore();

  useEffect(() => {
    api.get(`/chats/${chatId}/members`)
      .then(({ data }) => setMembers(data.members))
      .catch(() => {});
  }, [chatId]);

  const openDirect = async (targetUser) => {
    if (targetUser.id === currentUser.id) return;
    try {
      const { data } = await api.post('/chats/direct', { targetUserId: targetUser.id });
      const updated = await api.get('/chats');
      setChats(updated.data.chats);
    } catch {}
    onClose();
  };

  return (
    <div style={{ width: 240, borderLeft: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Участники ({members.length})</span>
        <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {members.map(m => (
          <div
            key={m.id}
            onClick={() => openDirect(m)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: m.id !== currentUser.id ? 'pointer' : 'default', borderRadius: 8, margin: '0 4px' }}
            onMouseEnter={e => { if (m.id !== currentUser.id) e.currentTarget.style.background = 'var(--bg-2)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ position: 'relative' }}>
              <Avatar user={m} size={32} />
              {onlineUsers.has(m.id) && (
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, background: '#1D9E75', borderRadius: '50%', border: '2px solid var(--bg)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.display_name} {m.role === 'admin' && <span style={{ fontSize: 10, color: 'var(--purple)', background: 'var(--purple-light)', padding: '1px 5px', borderRadius: 6 }}>admin</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {onlineUsers.has(m.id) ? <span style={{ color: '#1D9E75' }}>онлайн</span> : formatLastSeen(m.last_seen)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
