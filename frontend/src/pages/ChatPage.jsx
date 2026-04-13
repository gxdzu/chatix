import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import Sidebar from '../components/Layout/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import ProfilePanel from '../components/Layout/ProfilePanel';

export default function ChatPage() {
  const { chatId } = useParams();
  const chats = useChatStore(s => s.chats);
  const [showProfile, setShowProfile] = useState(false);

  const activeChat = chats.find(c => c.id === chatId);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onProfileOpen={() => setShowProfile(true)} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeChat ? (
          <ChatWindow chat={activeChat} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 16 }}>Выбери чат слева</div>
          </div>
        )}
      </div>
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
}
