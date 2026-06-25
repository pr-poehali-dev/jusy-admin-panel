import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import {
  getLoginUrl, handleCallback, getChannels, getMembers, sendMessage, botAction,
  saveUser, loadUser, logout,
  type AuthUser, type Guild, type Channel, type Member, type Role,
} from '@/lib/api';

const TABS = [
  { id: 'general', label: 'Общее' },
  { id: 'moderation', label: 'Модерирование' },
  { id: 'members', label: 'Участники' },
  { id: 'messages', label: 'Сообщения' },
  { id: 'audit', label: 'Аудит' },
];

function guildIcon(g: Guild): string | null {
  return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
}

function guildBanner(g: Guild): string {
  const colors = ['#5865F2', '#ED4245', '#FEE75C', '#57F287', '#EB459E'];
  const idx = parseInt(g.id.slice(-1), 16) % colors.length;
  return colors[idx];
}

function SectionBlock({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="juniper-section">
      <div className="juniper-section-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-slate-400" />
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={`juniper-toggle ${value ? 'on' : ''}`} onClick={() => onChange(!value)} />
  );
}

function NavBar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <header className="bg-[#111] border-b border-[#333] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <span className="font-display font-bold text-white text-lg">JusyBot</span>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
        <span className="hover:text-white cursor-pointer">Документация</span>
        <span className="hover:text-white cursor-pointer">Команды</span>
        <span className="hover:text-white cursor-pointer">Статистика</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm font-bold overflow-hidden">
          {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.username[0]}
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-white text-sm">
          <Icon name="LogOut" size={16} />
        </button>
      </div>
    </header>
  );
}

export default function Index() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [view, setView] = useState<'servers' | 'panel'>('servers');
  const [selected, setSelected] = useState<Guild | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [search, setSearch] = useState('');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channelId, setChannelId] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  const [prefix, setPrefix] = useState('!');
  const [botLang, setBotLang] = useState('Русский');
  const [deleteSuccess, setDeleteSuccess] = useState('20');
  const [deleteError, setDeleteError] = useState('10');
  const [useDiscordReply, setUseDiscordReply] = useState(true);
  const [mentionInReply, setMentionInReply] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      handleCallback(code)
        .then((u) => { saveUser(u); setUser(u); window.history.replaceState({}, '', '/'); })
        .catch(() => toast({ title: 'Не удалось войти через Discord', variant: 'destructive' }))
        .finally(() => setLoadingAuth(false));
    } else {
      setUser(loadUser());
      setLoadingAuth(false);
    }
  }, []);

  const openPanel = (g: Guild) => {
    setSelected(g);
    setView('panel');
    setActiveTab('general');
    getChannels(g.id).then((ch) => { setChannels(ch); if (ch[0]) setChannelId(ch[0].id); });
    getMembers(g.id).then((d) => { setMembers(d.members); setRoles(d.roles); });
  };

  const handleSend = async () => {
    if (!channelId || !msgText.trim()) return;
    setSending(true);
    const ok = await sendMessage(channelId, msgText.trim());
    setSending(false);
    if (ok) { toast({ title: 'Сообщение отправлено' }); setMsgText(''); }
    else toast({ title: 'Ошибка отправки', variant: 'destructive' });
  };

  const handleMod = async (action: 'kick' | 'ban', m: Member) => {
    const ok = await botAction(action, { guild_id: selected!.id, user_id: m.id });
    if (ok) { setMembers(p => p.filter(x => x.id !== m.id)); toast({ title: `${m.username} ${action === 'kick' ? 'кикнут' : 'забанен'}` }); }
    else toast({ title: 'Недостаточно прав у бота', variant: 'destructive' });
  };

  const handleRole = async (m: Member, r: Role, has: boolean) => {
    const ok = await botAction(has ? 'remove_role' : 'add_role', { guild_id: selected!.id, user_id: m.id, role_id: r.id });
    if (ok) {
      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, roles: has ? x.roles.filter(rid => rid !== r.id) : [...x.roles, r.id] } : x));
    }
  };

  const login = async () => { window.location.href = await getLoginUrl(); };
  const handleLogout = () => { logout(); setUser(null); setView('servers'); setSelected(null); };

  if (loadingAuth) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center text-slate-300 gap-3">
        <Icon name="LoaderCircle" size={24} className="animate-spin" /> Загрузка…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mesh-bg min-h-screen flex flex-col">
        <header className="bg-[#111] border-b border-[#333] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <span className="font-display font-bold text-white text-lg">JusyBot</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <span className="hover:text-white cursor-pointer">Документация</span>
            <span className="hover:text-white cursor-pointer">Команды</span>
            <span className="hover:text-white cursor-pointer">Статистика</span>
          </div>
          <button onClick={login} className="juniper-btn flex items-center gap-2">
            <Icon name="LogIn" size={14} /> Войти
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md animate-fade-in">
            <div className="text-7xl mb-6 animate-float inline-block">🤖</div>
            <h1 className="font-display font-bold text-3xl text-white mb-3">JusyBot Panel</h1>
            <p className="text-slate-400 mb-8 text-sm">Панель управления Discord-ботом Jusy. Войди через Discord, чтобы продолжить.</p>
            <button onClick={login} className="juniper-btn inline-flex items-center gap-2 text-base px-8 py-3">
              <Icon name="LogIn" size={18} /> Войти через Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = user.guilds.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  if (view === 'servers') {
    return (
      <div className="mesh-bg min-h-screen flex flex-col text-white">
        <NavBar user={user} onLogout={handleLogout} />

        <div className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
          <h2 className="text-center text-2xl font-display font-bold mb-6 flex items-center justify-center gap-3">
            Выберите <span className="text-[#5865F2]">⚙</span> Discord сервер
          </h2>

          <div className="relative max-w-lg mx-auto mb-8">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="juniper-field pl-9 rounded-full border-[#444]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((g, i) => (
              <div key={g.id} className="server-card animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }} onClick={() => openPanel(g)}>
                <div className="h-20 flex items-end px-3 pb-2 relative" style={{ background: guildBanner(g) }}>
                  <div className="w-12 h-12 rounded-full border-4 border-[#2a2a2a] overflow-hidden bg-[#1a1a1a] flex items-center justify-center text-xl absolute -bottom-6 left-3">
                    {guildIcon(g) ? <img src={guildIcon(g)!} alt="" className="w-full h-full object-cover" /> : g.name[0]}
                  </div>
                </div>
                <div className="pt-8 px-3 pb-3">
                  <p className="text-sm font-semibold text-white truncate">{g.name}</p>
                  <button className="mt-2 text-xs text-[#FFA550] font-bold uppercase tracking-wider hover:text-orange-300">
                    Управление →
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-4 text-center text-slate-500 py-12">Нет доступных серверов</p>
            )}
          </div>
        </div>

        <footer className="bg-[#111] border-t border-[#333] py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <span className="font-display font-bold text-white">JusyBot</span>
            </div>
            <p className="text-xs text-slate-500">© 2024–2026 — JusyBot · Все права защищены</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="mesh-bg min-h-screen flex flex-col text-white">
      <NavBar user={user} onLogout={handleLogout} />

      {/* Server header */}
      <div className="relative bg-[#111] border-b border-[#333] overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: selected ? guildBanner(selected) : '#333' }} />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-[120px] pointer-events-none select-none">⚙</div>
        <div className="relative px-6 py-5 flex items-center gap-4">
          <button onClick={() => setView('servers')} className="text-slate-400 hover:text-white mr-2">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#333] flex items-center justify-center text-xl shrink-0">
            {selected && guildIcon(selected) ? <img src={guildIcon(selected)!} alt="" className="w-full h-full object-cover" /> : selected?.name[0]}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">{selected?.name}</h1>
            <p className="text-xs text-slate-400">Панель управления</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto px-6 border-t border-[#222]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`juniper-tab ${activeTab === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">

        {activeTab === 'general' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <SectionBlock title="Основное">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Префикс</label>
                    <input value={prefix} onChange={e => setPrefix(e.target.value)} className="juniper-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Язык интерфейса бота</label>
                      <select value={botLang} onChange={e => setBotLang(e.target.value)} className="juniper-field">
                        <option>Русский</option>
                        <option>English</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Язык команд бота</label>
                      <select className="juniper-field">
                        <option>Русский</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock title="Доступ и безопасность">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Доверенные роли Администраторов</label>
                  <select className="juniper-field">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    {roles.length === 0 && <option>Загрузка ролей…</option>}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Только Владелец Сервера и Администраторы с указанными ролями смогут получить доступ к панели.</p>
                </div>
              </SectionBlock>

              <SectionBlock title="Присоединение участников">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Начальные роли</label>
                  <select className="juniper-field">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    {roles.length === 0 && <option>Загрузка ролей…</option>}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Будут назначены новым участникам</p>
                </div>
              </SectionBlock>
            </div>

            <div>
              <SectionBlock title="Сообщения">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-slate-300">Использовать систему ответов Discord где это возможно</span>
                    <Toggle value={useDiscordReply} onChange={setUseDiscordReply} />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-slate-300">Упоминать участников в системе ответов Discord</span>
                    <Toggle value={mentionInReply} onChange={setMentionInReply} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Удалять сообщения об успешных операциях (сек)</label>
                      <input value={deleteSuccess} onChange={e => setDeleteSuccess(e.target.value)} type="number" className="juniper-field" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Удалять сообщения об ошибках (сек)</label>
                      <input value={deleteError} onChange={e => setDeleteError(e.target.value)} type="number" className="juniper-field" />
                    </div>
                  </div>
                </div>
              </SectionBlock>
            </div>

            <div className="md:col-span-2">
              <button className="juniper-btn">Сохранить изменения</button>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <SectionBlock title="Основное">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Роли модераторов</label>
                    <select className="juniper-field">
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  {[
                    'Не распространять кулдаун команд на Администраторов и Модераторов',
                    'Разрешить модераторам с более высокой ролью наказывать модераторов ниже',
                    'Установить время действия предупреждения по-умолчанию',
                  ].map((label) => (
                    <label key={label} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 accent-orange-400" />
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock title="Список участников · Кик и Бан">
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 bg-[#1e1e1e] rounded p-2">
                      <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-sm overflow-hidden shrink-0">
                        {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.username[0]}
                      </div>
                      <span className="text-sm flex-1 truncate">{m.username}</span>
                      <button onClick={() => handleMod('kick', m)} className="text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-1 rounded">Кик</button>
                      <button onClick={() => handleMod('ban', m)} className="text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-2 py-1 rounded">Бан</button>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Нет участников или у бота нет доступа</p>}
                </div>
              </SectionBlock>
            </div>

            <div>
              <SectionBlock title="Действия за нарушения">
                <div className="bg-[#FFA550]/10 border border-[#FFA550]/30 rounded p-3 text-sm text-orange-300">
                  ⚠ У вас пока нет ни одного действия за нарушение. Добавьте парочку!
                </div>
                <button className="juniper-btn mt-3 text-xs">+ Добавить действие</button>
              </SectionBlock>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <SectionBlock title={`Участники · ${members.length}`}>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-[#1e1e1e] rounded p-3">
                  <div className="w-9 h-9 rounded-full bg-[#333] flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.username[0]}
                  </div>
                  <span className="text-sm flex-1 truncate font-medium">{m.username}</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
                    {roles.slice(0, 5).map(r => {
                      const has = m.roles.includes(r.id);
                      return (
                        <button key={r.id} onClick={() => handleRole(m, r, has)}
                          className={`text-[11px] px-2 py-0.5 rounded border transition-all ${has ? 'border-orange-400/50 text-orange-300 bg-orange-400/10' : 'border-[#444] text-slate-400 hover:border-[#666]'}`}>
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Нет участников или у бота нет доступа к списку</p>}
            </div>
          </SectionBlock>
        )}

        {activeTab === 'messages' && (
          <div className="max-w-2xl">
            <SectionBlock title="Отправить сообщение от имени бота">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Канал</label>
                  <select value={channelId} onChange={e => setChannelId(e.target.value)} className="juniper-field">
                    {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    {channels.length === 0 && <option>Загрузка каналов…</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Текст сообщения</label>
                  <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={4}
                    placeholder="Введите сообщение..."
                    className="juniper-field resize-none" />
                </div>
                <button onClick={handleSend} disabled={sending || !msgText.trim()} className="juniper-btn flex items-center gap-2 disabled:opacity-40">
                  {sending ? <Icon name="LoaderCircle" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                  Отправить
                </button>
              </div>
            </SectionBlock>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="max-w-3xl">
            <SectionBlock title="Аудит сервера">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Игнорируемые текстовые каналы и категории</label>
                <select className="juniper-field">
                  {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">Аудит редактирования/удаления сообщений будет отключён в указанных каналах</p>
              </div>
            </SectionBlock>

            <div className="bg-[#FFA550] rounded p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[#1a1a1a] text-sm uppercase tracking-wider">Хронология действий</span>
                <div className="flex gap-2">
                  <select className="bg-[#1a1a1a]/20 border border-[#1a1a1a]/20 rounded px-2 py-1 text-xs text-[#1a1a1a]">
                    <option>Тип действия</option>
                  </select>
                  <select className="bg-[#1a1a1a]/20 border border-[#1a1a1a]/20 rounded px-2 py-1 text-xs text-[#1a1a1a]">
                    <option>Канал</option>
                    {channels.map(c => <option key={c.id}>#{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-[#FFA550]/30 rounded p-3 text-sm text-[#1a1a1a]">
                ℹ Нет данных для отображения
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
