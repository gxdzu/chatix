import { io } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io('/', {
    auth: { token },
    transports: ['websocket'],
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  const store = useChatStore.getState();

  socket.on('message:new', (msg) => {
    store.addMessage(msg.chat_id, msg);
    const active = store.activeChat;
    if (!active || active.id !== msg.chat_id) {
      store.incrementUnread(msg.chat_id);
    }
  });

  socket.on('message:edited', ({ messageId, content, edited_at }) => {
    const msgs = useChatStore.getState().messages;
    for (const [chatId, messages] of Object.entries(msgs)) {
      if (messages.find(m => m.id === messageId)) {
        store.updateMessage(chatId, messageId, { content, is_edited: true, edited_at });
        break;
      }
    }
  });

  socket.on('message:deleted', ({ messageId, chatId }) => {
    store.deleteMessage(chatId, messageId);
  });

  socket.on('reaction:updated', ({ messageId, reactions }) => {
    store.setReactions(messageId, reactions);
  });

  socket.on('user:online', ({ userId, online }) => {
    store.setUserOnline(userId, online);
  });

  socket.on('typing:start', ({ chatId, userId, display_name }) => {
    store.setTyping(chatId, userId, display_name, true);
    setTimeout(() => store.setTyping(chatId, userId, display_name, false), 3000);
  });

  socket.on('typing:stop', ({ chatId, userId }) => {
    store.setTyping(chatId, userId, '', false);
  });

  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
