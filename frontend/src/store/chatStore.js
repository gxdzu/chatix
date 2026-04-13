import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  onlineUsers: new Set(),
  typingUsers: {},

  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat }),

  addMessage: (chatId, message) => {
    set(s => ({
      messages: { ...s.messages, [chatId]: [...(s.messages[chatId] || []), message] },
      chats: s.chats.map(c => c.id === chatId ? { ...c, last_message: message } : c),
    }));
  },

  setMessages: (chatId, messages, prepend = false) => {
    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: prepend ? [...messages, ...(s.messages[chatId] || [])] : messages,
      },
    }));
  },

  updateMessage: (chatId, messageId, updates) => {
    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).map(m => m.id === messageId ? { ...m, ...updates } : m),
      },
    }));
  },

  deleteMessage: (chatId, messageId) => {
    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] || []).map(m =>
          m.id === messageId ? { ...m, is_deleted: true, content: null } : m
        ),
      },
    }));
  },

  setReactions: (messageId, reactions) => {
    set(s => {
      const newMsgs = {};
      for (const [chatId, msgs] of Object.entries(s.messages)) {
        newMsgs[chatId] = msgs.map(m => m.id === messageId ? { ...m, reactions } : m);
      }
      return { messages: newMsgs };
    });
  },

  setUserOnline: (userId, online) => {
    set(s => {
      const next = new Set(s.onlineUsers);
      online ? next.add(userId) : next.delete(userId);
      return { onlineUsers: next };
    });
  },

  setTyping: (chatId, userId, name, isTyping) => {
    set(s => {
      const chatTyping = { ...(s.typingUsers[chatId] || {}) };
      if (isTyping) chatTyping[userId] = name;
      else delete chatTyping[userId];
      return { typingUsers: { ...s.typingUsers, [chatId]: chatTyping } };
    });
  },

  incrementUnread: (chatId) => {
    set(s => ({
      chats: s.chats.map(c => c.id === chatId ? { ...c, unread_count: (parseInt(c.unread_count) || 0) + 1 } : c),
    }));
  },

  clearUnread: (chatId) => {
    set(s => ({ chats: s.chats.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c) }));
  },
}));
