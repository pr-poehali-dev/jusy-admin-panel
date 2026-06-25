import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import {
  getChannels, getMembers, sendMessage, botAction,
  type Channel, type Member, type Role, type Guild,
} from '@/lib/api';

interface Props {
  guild: Guild;
  section: string;
}

export default function ServerView({ guild, section }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [channelId, setChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getChannels(guild.id), getMembers(guild.id)])
      .then(([ch, mem]) => {
        if (!alive) return;
        setChannels(ch);
        setMembers(mem.members);
        setRoles(mem.roles);
        if (ch[0]) setChannelId(ch[0].id);
      })
      .catch(() => toast({ title: 'Не удалось загрузить данные сервера', variant: 'destructive' }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [guild.id]);

  const handleSend = async () => {
    if (!channelId || !message.trim()) return;
    setSending(true);
    const ok = await sendMessage(channelId, message.trim());
    setSending(false);
    if (ok) {
      toast({ title: 'Сообщение отправлено от имени бота 🚀' });
      setMessage('');
    } else {
      toast({ title: 'Ошибка отправки', description: 'Проверь права бота в канале', variant: 'destructive' });
    }
  };

  const handleMod = async (action: 'kick' | 'ban', m: Member) => {
    const ok = await botAction(action, { guild_id: guild.id, user_id: m.id });
    if (ok) {
      toast({ title: `${m.username}: ${action === 'kick' ? 'кикнут' : 'забанен'}` });
      if (action === 'kick' || action === 'ban') setMembers((p) => p.filter((x) => x.id !== m.id));
    } else {
      toast({ title: 'Недостаточно прав у бота', variant: 'destructive' });
    }
  };

  const handleRole = async (m: Member, role: Role, has: boolean) => {
    const ok = await botAction(has ? 'remove_role' : 'add_role', {
      guild_id: guild.id, user_id: m.id, role_id: role.id,
    });
    if (ok) {
      setMembers((prev) => prev.map((x) =>
        x.id === m.id
          ? { ...x, roles: has ? x.roles.filter((r) => r !== role.id) : [...x.roles, role.id] }
          : x
      ));
      toast({ title: `Роль ${role.name} ${has ? 'снята' : 'выдана'}` });
    } else {
      toast({ title: 'Недостаточно прав у бота', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-10 flex items-center justify-center text-slate-400 gap-3">
        <Icon name="LoaderCircle" size={20} className="animate-spin" /> Загружаю данные сервера…
      </div>
    );
  }

  if (section === 'messages') {
    return (
      <div className="glass rounded-2xl p-6 max-w-2xl animate-fade-in">
        <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
          <Icon name="Send" size={20} className="text-indigo-400" /> Сообщение от имени бота
        </h3>
        <label className="text-sm text-slate-400 mb-2 block">Канал</label>
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 mb-4 text-sm outline-none focus:border-indigo-400/50"
        >
          {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
        <label className="text-sm text-slate-400 mb-2 block">Текст сообщения</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Привет от Jusy 👋"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 mb-4 text-sm outline-none focus:border-indigo-400/50 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90 disabled:opacity-40 transition-opacity px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          {sending ? <Icon name="LoaderCircle" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
          Отправить
        </button>
      </div>
    );
  }

  // members & moderation share the member list
  const isMod = section === 'moderation';

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
        <Icon name={isMod ? 'ShieldAlert' : 'Users'} size={20} className="text-fuchsia-400" />
        {isMod ? 'Модерация' : 'Участники'} · {members.length}
      </h3>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {members.map((m) => (
          <div key={m.id} className="bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
              {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.username[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-sm flex-1 truncate">{m.username}</span>
            {isMod ? (
              <div className="flex gap-2">
                <button onClick={() => handleMod('kick', m)} className="text-xs bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Icon name="UserMinus" size={13} /> Кик
                </button>
                <button onClick={() => handleMod('ban', m)} className="text-xs bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Icon name="Ban" size={13} /> Бан
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
                {roles.slice(0, 6).map((r) => {
                  const has = m.roles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRole(m, r, has)}
                      className={`text-[11px] px-2 py-1 rounded-md transition-all ${has ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">Нет участников или у бота нет доступа к списку</p>
        )}
      </div>
    </div>
  );
}
