import { useState, useRef, useEffect } from 'react';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';

export default function MessageInput({ chatId, replyTo, editMessage, onCancelReply, onCancelEdit }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const socket = getSocket();
  const typingRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editMessage) setText(editMessage.content || '');
    else setText('');
    inputRef.current?.focus();
  }, [editMessage, replyTo]);

  const handleTyping = () => {
    socket?.emit('typing:start', { chatId });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => socket?.emit('typing:stop', { chatId }), 2000);
  };

  const send = () => {
    const content = text.trim();
    if (!content && !editMessage) return;

    if (editMessage) {
      socket?.emit('message:edit', { messageId: editMessage.id, content });
      onCancelEdit();
    } else {
      socket?.emit('message:send', {
        chatId, content, type: 'text',
        replyToId: replyTo?.id || null,
      });
      onCancelReply?.();
    }
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });

      let type = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'voice';

      socket?.emit('message:send', {
        chatId, type,
        fileUrl: data.url, fileName: data.filename, fileSize: data.size, mimeType: data.mimetype,
        replyToId: replyTo?.id || null,
      });
      onCancelReply?.();
    } catch (err) {
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border)' }}>
      {(replyTo || editMessage) && (
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-2)', borderRadius: 8, padding: '6px 10px', marginBottom: 6, gap: 8, borderLeft: '3px solid var(--purple)' }}>
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {editMessage ? <><b>Редактирование:</b> {editMessage.content}</> : <><b>{replyTo.sender?.display_name}:</b> {replyTo.content || '📎 Файл'}</>}
          </div>
          <button onClick={editMessage ? onCancelEdit : onCancelReply} style={{ color: 'var(--text-3)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <label style={{ cursor: 'pointer', padding: 8, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 18, display: 'flex', alignItems: 'center' }} title="Прикрепить файл">
          {uploading ? '⏳' : '📎'}
          <input type="file" style={{ display: 'none' }} onChange={handleFile} disabled={uploading} />
        </label>

        <div style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'flex-end', gap: 8, transition: 'border-color 0.15s' }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKey}
            placeholder="Написать сообщение..."
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', resize: 'none', color: 'var(--text)',
              fontSize: 14, lineHeight: 1.5, maxHeight: 120, overflow: 'auto',
              scrollbarWidth: 'none',
            }}
          />
        </div>

        <button
          onClick={send}
          disabled={!text.trim() && !editMessage}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: text.trim() || editMessage ? 'var(--purple)' : 'var(--bg-3)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'background 0.15s', flexShrink: 0,
          }}
        >
          {editMessage ? '✓' : '➤'}
        </button>
      </div>
    </div>
  );
}
