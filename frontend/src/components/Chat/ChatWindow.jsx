import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { formatDate } from '../../utils/format';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import MembersList from './MembersList';
import SearchPanel from './SearchPanel';
import Avatar from '../UI/Avatar';

export default function ChatWindow({ chat }) {
  const { messages, setMessages, clearUnread, typingUsers } = useChatStore();
  const user = useAuthStore(s => s.user);
  const msgs = messages[chat.id] || [];
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMessages();
    clearUnread(chat.id);
  }, [chat.id]);

  useEffect(() => {
    if (!loadingMore) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/messages/${chat.id}?limit=50`);
      setMessages(chat.id, data.messages);
      setHasMore(data.messages.length === 50);
    } catch {}
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || !msgs[0]) return;
    setLoadingMore(true);
    const prev = containerRef.current?.scrollHeight;
    try {
      const { data } = await api.get(`/messages/${chat.id}?limit=50&before=${msgs[0].created_at}`);
      setMessages(chat.id, data.messages, true);
      setHasMore(data.messages.length === 50);
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight - prev;
        }
      }, 0);
    } catch {} finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback((e) => {
    if (e.target.scrollTop < 80) loadMore();
  }, [msgs, hasMore, loadingMore]);

  const groupedMsgs = [];
  let lastDate = null;
  let lastSenderId = null;
  msgs.forEach((m, i) => {
    const date = formatDate(m.created_at);
    if (date !== lastDate) { groupedMsgs.push({ type: 'date', date }); lastDate = date; lastSenderId = null; }
    groupedMsgs.push({ type: 'message', message: m, showAvatar: m.sender?.id !== lastSenderId });
    lastSenderId = m.sender?.id;
  });

  const chatTyping = typingUsers[chat.id] || {};
  const typingNames = Object.values(chatTyping).filter(n => n);

  const getChatName = () => {
    if (chat.type === 'direct') {
      const other = chat.other_user;
      return other?.display_name || chat.name;
    }
    return chat.name;
  };

  const getChatSub = () => {
    if (chat.type === 'direct') {
      const other = chat.other_user;
      return other ? `@${other.username}` : '';
    }
    return `${chat.member_count || ''} участников`;
  };

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <Avatar user={chat.type === 'direct' ? chat.other_user : { display_name: chat.name }} size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{getChatName()}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {typingNames.length > 0 ? <span style={{ color: 'var(--purple)' }}>{typingNames.join(', ')} печатает...</span> : getChatSub()}
          </div>
        </div>
        <button onClick={() => { setShowSearch(s => !s); setShowMembers(false); }} style={{ padding: '6px 10px', borderRadius: 8, background: showSearch ? 'var(--purple-light)' : 'var(--bg-2)', border: '1px solid var(--border)', color: showSearch ? 'var(--purple)' : 'var(--text-2)', fontSize: 16 }} title="Поиск">🔍</button>
        {chat.type !== 'direct' && (
          <button onClick={() => { setShowMembers(s => !s); setShowSearch(false); }} style={{ padding: '6px 10px', borderRadius: 8, background: showMembers ? 'var(--purple-light)' : 'var(--bg-2)', border: '1px solid var(--border)', color: showMembers ? 'var(--purple)' : 'var(--text-2)', fontSize: 16 }} title="Участники">👥</button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div ref={containerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingMore && <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-3)', fontSize: 13 }}>Загрузка...</div>}
          {groupedMsgs.map((item, i) => {
            if (item.type === 'date') {
              return (
                <div key={`d-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)', padding: '2px 10px', background: 'var(--bg-2)', borderRadius: 10 }}>{item.date}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              );
            }
            return (
              <MessageItem
                key={item.message.id}
                message={item.message}
                showAvatar={item.showAvatar}
                onReply={setReplyTo}
                onEdit={setEditMessage}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>

        {showMembers && <MembersList chatId={chat.id} onClose={() => setShowMembers(false)} />}
        {showSearch && <SearchPanel chatId={chat.id} onClose={() => setShowSearch(false)} onJump={(msg) => {}} />}
      </div>

      <MessageInput
        chatId={chat.id}
        replyTo={replyTo}
        editMessage={editMessage}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditMessage(null)}
      />
    </div>
  );
}
