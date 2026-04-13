import { getInitials } from '../../utils/format';

const COLORS = ['#534AB7','#0F6E56','#993C1D','#185FA5','#993556','#3B6D11','#854F0B'];

const getColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
};

export default function Avatar({ user, size = 36, style = {} }) {
  const name = user?.display_name || user?.username || '?';
  const bg = getColor(name);
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: user?.avatar_url ? 'transparent' : bg + '22', color: bg, ...style }}>
      {user?.avatar_url ? <img src={user.avatar_url} alt={name} /> : getInitials(name)}
    </div>
  );
}
