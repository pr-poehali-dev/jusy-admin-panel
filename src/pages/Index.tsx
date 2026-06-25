import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import ServerView from '@/components/panel/ServerView';
import {
  getLoginUrl, handleCallback, getGuildInfo, saveUser, loadUser, logout,
  type AuthUser, type Guild, type GuildInfo,
} from '@/lib/api';

const NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'members', label: 'Участники', icon: 'Users' },
  { id: 'moderation', label: 'Модерация', icon: 'ShieldAlert' },
  { id: 'messages', label: 'Сообщения', icon: 'Send' },
];

function guildIcon(g: Guild): string | null {
  return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
}

export default function Index() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [active, setActive] = useState('dashboard');
  const [selected, setSelected] = useState<Guild | null>(null);
  const [info, setInfo] = useState<GuildInfo | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      handleCallback(code)
        .then((u) => {
          saveUser(u);
          setUser(u);
          window.history.replaceState({}, '', '/');
        })
        .catch(() => toast({ title: 'Не удалось войти через Discord', variant: 'destructive' }))
        .finally(() => setLoadingAuth(false));
    } else {
      setUser(loadUser());
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      setInfo(null);
      getGuildInfo(selected.id).then((i) => { if (i && !(i as { error?: string }).error) setInfo(i); }).catch(() => {});
    }
  }, [selected]);

  const login = async () => {
    const url = await getLoginUrl();
    window.location.href = url;
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setSelected(null);
  };

  if (loadingAuth) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center text-slate-300 gap-3">
        <Icon name="LoaderCircle" size={24} className="animate-spin" /> Загрузка…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-indigo-500/30 animate-float">
            🤖
          </div>
          <h1 className="font-display font-bold text-3xl mb-2 gradient-text">Jusy Panel</h1>
          <p className="text-slate-400 mb-8">Панель управления Discord-ботом. Войди через Discord, чтобы продолжить.</p>
          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90 transition-opacity py-4 rounded-2xl font-medium flex items-center justify-center gap-3 text-white"
          >
            <Icon name="LogIn" size={20} /> Войти через Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg min-h-screen text-slate-100 font-sans">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 flex-col glass border-r border-white/5 p-5 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30 animate-float">🤖</div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Jusy</h1>
              <p className="text-xs text-slate-400 mt-1">{user.role === 'dev' ? 'Разработчик' : 'Администратор'}</p>
            </div>
          </div>

          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-2">Серверы</p>
          <div className="flex flex-col gap-1 mb-5 max-h-64 overflow-y-auto pr-1">
            {user.guilds.length === 0 && <p className="text-xs text-slate-500 px-2">Нет доступных серверов</p>}
            {user.guilds.map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelected(g); setActive('dashboard'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${selected?.id === g.id ? 'bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/10 text-white border border-indigo-400/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm overflow-hidden shrink-0">
                  {guildIcon(g) ? <img src={guildIcon(g)!} alt="" className="w-full h-full object-cover" /> : g.name[0]}
                </div>
                <span className="truncate">{g.name}</span>
              </button>
            ))}
          </div>

          {selected && (
            <>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-2">Управление</p>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Icon name={item.icon} size={18} className={active === item.id ? 'text-indigo-300' : ''} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </>
          )}

          <div className="mt-auto glass rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.username[0]}
            </div>
            <span className="text-sm font-medium truncate flex-1">{user.username}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors">
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          {!selected ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl lg:text-3xl font-display font-bold mb-2">Привет, {user.username} 👋</h2>
              <p className="text-slate-400 mb-8">Выбери сервер слева, чтобы управлять им. Доступно серверов: {user.guilds.length}</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {user.guilds.map((g, i) => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g)}
                    className="glass card-hover rounded-2xl p-5 text-left animate-fade-in opacity-0"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl overflow-hidden">
                        {guildIcon(g) ? <img src={guildIcon(g)!} alt="" className="w-full h-full object-cover" /> : g.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{g.name}</p>
                        <p className="text-xs text-slate-400">{g.owner ? 'Владелец' : 'Администратор'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between mb-8 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl overflow-hidden">
                    {guildIcon(selected) ? <img src={guildIcon(selected)!} alt="" className="w-full h-full object-cover" /> : selected.name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">{selected.name}</h2>
                    <p className="text-sm text-slate-400">{info ? `${info.members.toLocaleString('ru')} участников · ${info.online.toLocaleString('ru')} онлайн` : 'Загрузка статистики…'}</p>
                  </div>
                </div>
              </header>

              {active === 'dashboard' ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {[
                    { label: 'Участников', value: info?.members ?? '—', icon: 'Users', accent: 'from-indigo-500 to-blue-500' },
                    { label: 'Онлайн', value: info?.online ?? '—', icon: 'Activity', accent: 'from-emerald-500 to-teal-500' },
                    { label: 'Статус бота', value: info ? 'Активен' : '—', icon: 'Bot', accent: 'from-fuchsia-500 to-pink-500' },
                  ].map((s, i) => (
                    <div key={s.label} className="glass card-hover rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon name={s.icon} size={20} />
                      </div>
                      <p className="text-2xl font-display font-bold">{typeof s.value === 'number' ? s.value.toLocaleString('ru') : s.value}</p>
                      <p className="text-sm text-slate-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <ServerView guild={selected} section={active} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
