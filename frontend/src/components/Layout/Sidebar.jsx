import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { formatTime } from '../../utils/format';
import api from '../../utils/api';
import Avatar from '../UI/Avatar';

export default function Sidebar({ onProfileOpen }) {
  const { chats, setChats, setActiveChat, onlineUsers } = useChatStore();
  const user = useAuthStore(s => s.user);
  const { chatId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/chats').then(({ data }) => {
      setChats(data.chats);
      if (!chatId && data.chats.length > 0) {
        navigate(`/chat/${data.chats[0].id}`);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatId) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) setActiveChat(chat);
    }
  }, [chatId, chats]);

  const groups = chats.filter(c => c.type === 'general' || c.type === 'subgroup');
  const directs = chats.filter(c => c.type === 'direct');

  const ChatItem = ({ chat }) => {
    const isActive = chat.id === chatId;
    const lastMsg = chat.last_message;
    const unread = parseInt(chat.unread_count) || 0;

    const getChatName = () => {
      if (chat.type === 'direct') {
        return chat.other_user?.display_name || chat.name || 'Личный чат';
      }
      return chat.name;
    };

    const getChatUser = () => {
      if (chat.type === 'direct') return chat.other_user;
      return { display_name: chat.name };
    };

    const getPreview = () => {
      if (!lastMsg) return '';
      if (lastMsg.is_deleted) return 'Сообщение удалено';
      if (lastMsg.type === 'image') return '🖼 Изображение';
      if (lastMsg.type === 'file') return `📎 ${lastMsg.file_name || 'Файл'}`;
      if (lastMsg.type === 'voice') return '🎤 Голосовое';
      const senderName = lastMsg.sender?.display_name?.split(' ')[0] || '';
      return lastMsg.sender?.id === user?.id ? `Вы: ${lastMsg.content}` : (chat.type !== 'direct' ? `${senderName}: ${lastMsg.content}` : lastMsg.content);
    };

    return (
      <div
        onClick={() => navigate(`/chat/${chat.id}`)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
          background: isActive ? 'var(--purple-light)' : 'none', borderRadius: 10, margin: '1px 6px',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-2)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar user={getChatUser()} size={42} />
          {chat.type === 'direct' && chat.other_user && onlineUsers.has(chat.other_user.id) && (
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: '#1D9E75', borderRadius: '50%', border: '2px solid var(--bg)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: isActive ? 600 : 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--purple)' : 'var(--text)' }}>
              {getChatName()}
            </span>
            {lastMsg && <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginLeft: 4 }}>{formatTime(lastMsg.created_at)}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{getPreview()}</span>
            {unread > 0 && (
              <span style={{ background: 'var(--purple)', color: 'white', borderRadius: 10, fontSize: 11, padding: '1px 6px', flexShrink: 0, marginLeft: 4 }}>{unread > 99 ? '99+' : unread}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: 'var(--sidebar-w)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg)', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>Чатикс</span>
        {user?.role === 'admin' && (
          <a href="/admin" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--purple)', background: 'var(--purple-light)', padding: '2px 8px', borderRadius: 6 }}>Админка</a>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {groups.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 20px 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Группы</div>
            {groups.map(c => <ChatItem key={c.id} chat={c} />)}
          </>
        )}
        {directs.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '10px 20px 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Личные</div>
            {directs.map(c => <ChatItem key={c.id} chat={c} />)}
          </>
        )}
      </div>

      <div
        onClick={onProfileOpen}
        style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <Avatar user={user} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.display_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{user?.username}</div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⚙</span>
      </div>
    </div>
  );
}
