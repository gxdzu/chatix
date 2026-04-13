import { useState, useRef } from 'react';
import { formatTime, formatFileSize } from '../../utils/format';
import { getSocket } from '../../utils/socket';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../UI/Avatar';
import EmojiPicker from './EmojiPicker';

const COMMON_EMOJIS = ['👍','❤️','😂','😮','😢','🔥','👏','🎉'];

export default function MessageItem({ message, onReply, onEdit, showAvatar = true }) {
  const user = useAuthStore(s => s.user);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const isOwn = message.sender?.id === user?.id;
  const socket = getSocket();

  if (message.is_deleted) {
    return (
      <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', padding: '2px 0' }}>
        <span style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', padding: '4px 12px', background: 'var(--bg-2)', borderRadius: 12 }}>
          Сообщение удалено
        </span>
      </div>
    );
  }

  const handleReaction = (emoji) => {
    socket?.emit('reaction:toggle', { messageId: message.id, emoji });
    setShowEmoji(false);
  };

  const handleDelete = () => {
    if (confirm('Удалить сообщение?')) {
      socket?.emit('message:delete', { messageId: message.id });
    }
    setShowMenu(false);
  };

  const groupedReactions = (message.reactions || []).reduce((acc, r) => {
    const key = r.emoji || r;
    if (!acc[key]) acc[key] = { count: 0, user_ids: [] };
    acc[key].count = r.count || 1;
    acc[key].user_ids = r.user_ids || [];
    return acc;
  }, {});

  return (
    <div
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, padding: '2px 0', position: 'relative' }}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => { setShowMenu(false); setShowEmoji(false); }}
    >
      {!isOwn && (
        <div style={{ width: 32, flexShrink: 0 }}>
          {showAvatar && <Avatar user={message.sender} size={32} />}
        </div>
      )}

      <div style={{ maxWidth: '70%' }}>
        {!isOwn && showAvatar && (
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--purple)', marginBottom: 3, paddingLeft: 2 }}>
            {message.sender?.display_name}
          </div>
        )}

        {message.reply_to && (
          <div style={{ background: 'var(--bg-3)', borderLeft: '3px solid var(--purple)', borderRadius: '4px 8px 0 0', padding: '4px 10px', fontSize: 12, color: 'var(--text-2)', marginBottom: 0 }}>
            <span style={{ fontWeight: 500 }}>{message.reply_to.sender?.display_name}</span>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {message.reply_to.content || '📎 Файл'}
            </div>
          </div>
        )}

        <div style={{
          background: isOwn ? 'var(--purple)' : 'var(--bg-2)',
          color: isOwn ? 'white' : 'var(--text)',
          borderRadius: message.reply_to ? (isOwn ? '12px 12px 4px 12px' : '0 12px 12px 4px') : (isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px'),
          padding: '8px 12px',
          fontSize: 14,
          lineHeight: 1.5,
        }}>
          <MessageContent message={message} isOwn={isOwn} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 }}>
            {message.is_edited && <span style={{ fontSize: 11, opacity: 0.6 }}>ред.</span>}
            <span style={{ fontSize: 11, opacity: 0.6 }}>{formatTime(message.created_at)}</span>
            {isOwn && <span style={{ fontSize: 11, opacity: 0.6 }}>✓✓</span>}
          </div>
        </div>

        {Object.keys(groupedReactions).length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                style={{
                  background: data.user_ids?.includes(user?.id) ? 'var(--purple-light)' : 'var(--bg-2)',
                  border: `1px solid ${data.user_ids?.includes(user?.id) ? 'var(--purple-mid)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '2px 8px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                {emoji} <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showMenu && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px' }}>
          <button onClick={() => setShowEmoji(s => !s)} style={{ padding: '4px 6px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 14, border: '1px solid var(--border)' }} title="Реакция">🙂</button>
          <button onClick={() => { onReply(message); setShowMenu(false); }} style={{ padding: '4px 6px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', color: 'var(--text-2)' }} title="Ответить">↩</button>
          {isOwn && (
            <button onClick={() => { onEdit(message); setShowMenu(false); }} style={{ padding: '4px 6px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', color: 'var(--text-2)' }} title="Редактировать">✏️</button>
          )}
          {(isOwn || user?.role === 'admin') && (
            <button onClick={handleDelete} style={{ padding: '4px 6px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', color: '#e24b4a' }} title="Удалить">🗑</button>
          )}
          {showEmoji && (
            <div style={{ position: 'absolute', bottom: '100%', [isOwn ? 'right' : 'left']: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, display: 'flex', gap: 6, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              {COMMON_EMOJIS.map(e => (
                <button key={e} onClick={() => handleReaction(e)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'background 0.1s' }}
                  onMouseEnter={el => el.target.style.background = 'var(--bg-2)'}
                  onMouseLeave={el => el.target.style.background = 'none'}
                >{e}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageContent({ message, isOwn }) {
  if (message.type === 'image') {
    return (
      <div>
        <img src={message.file_url} alt={message.file_name} style={{ maxWidth: 280, maxHeight: 300, borderRadius: 8, display: 'block', cursor: 'pointer' }} onClick={() => window.open(message.file_url)} />
        {message.content && <p style={{ marginTop: 4 }}>{message.content}</p>}
      </div>
    );
  }
  if (message.type === 'voice') {
    return <audio controls src={message.file_url} style={{ width: 220, height: 36 }} />;
  }
  if (message.type === 'file') {
    return (
      <a href={message.file_url} download={message.file_name} target="_blank" rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: isOwn ? 'rgba(255,255,255,0.15)' : 'var(--bg-3)', padding: '8px 12px', borderRadius: 8, color: 'inherit' }}>
        <span style={{ fontSize: 22 }}>📎</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{message.file_name}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{formatFileSize(message.file_size)}</div>
        </div>
      </a>
    );
  }
  return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</span>;
}
