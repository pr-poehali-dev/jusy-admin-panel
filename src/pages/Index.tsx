import { useState } from 'react';
import Icon from '@/components/ui/icon';

const NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'servers', label: 'Серверы', icon: 'Server' },
  { id: 'members', label: 'Участники', icon: 'Users' },
  { id: 'moderation', label: 'Модерация', icon: 'ShieldAlert' },
  { id: 'messages', label: 'Сообщения', icon: 'Send' },
  { id: 'logs', label: 'Логи', icon: 'ScrollText' },
];

const STATS = [
  { label: 'Серверов', value: '142', delta: '+8', icon: 'Server', accent: 'from-indigo-500 to-blue-500' },
  { label: 'Участников', value: '38.4K', delta: '+1.2K', icon: 'Users', accent: 'from-fuchsia-500 to-pink-500' },
  { label: 'Команд за день', value: '9 271', delta: '+14%', icon: 'Terminal', accent: 'from-violet-500 to-purple-500' },
  { label: 'Аптайм', value: '99.9%', delta: 'stable', icon: 'Activity', accent: 'from-emerald-500 to-teal-500' },
];

const SERVERS = [
  { name: 'Neon Gaming', members: 12840, online: 3201, icon: '🎮', region: 'Россия' },
  { name: 'Code & Coffee', members: 5420, online: 870, icon: '☕', region: 'Европа' },
  { name: 'Jusy Support', members: 9310, online: 2105, icon: '🤖', region: 'Россия' },
  { name: 'Art Vibes', members: 3120, online: 540, icon: '🎨', region: 'США' },
  { name: 'Music Lounge', members: 7680, online: 1430, icon: '🎵', region: 'Европа' },
  { name: 'Dev Hub', members: 2150, online: 312, icon: '⚙️', region: 'Азия' },
];

const ACTIVITY = [
  { user: 'Анна', action: 'выдала роль', target: 'Модератор · Neon Gaming', time: '2 мин', icon: 'UserPlus', color: 'text-emerald-400' },
  { user: 'Игорь', action: 'забанил', target: 'spammer#0231 · Dev Hub', time: '11 мин', icon: 'Ban', color: 'text-rose-400' },
  { user: 'Jusy', action: 'отправил сообщение', target: '#анонсы · Music Lounge', time: '24 мин', icon: 'Send', color: 'text-indigo-400' },
  { user: 'Мария', action: 'замутила', target: 'troll#9921 · Art Vibes', time: '38 мин', icon: 'MicOff', color: 'text-amber-400' },
];

export default function Index() {
  const [active, setActive] = useState('dashboard');
  const [role, setRole] = useState<'dev' | 'admin'>('dev');

  return (
    <div className="mesh-bg min-h-screen text-slate-100 font-sans">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col glass border-r border-white/5 p-5 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30 animate-float">
              🤖
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Jusy</h1>
              <p className="text-xs text-slate-400 mt-1">панель управления</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active === item.id
                    ? 'bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/10 text-white border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon name={item.icon} size={18} className={active === item.id ? 'text-indigo-300' : ''} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto glass rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-2">Режим доступа</p>
            <div className="flex gap-1 bg-black/30 rounded-lg p-1">
              <button
                onClick={() => setRole('dev')}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${role === 'dev' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
              >
                Разработчик
              </button>
              <button
                onClick={() => setRole('admin')}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${role === 'admin' ? 'bg-fuchsia-500 text-white' : 'text-slate-400'}`}
              >
                Админ
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between mb-10 animate-fade-in">
            <div>
              <p className="text-sm text-slate-400">С возвращением,</p>
              <h2 className="text-2xl lg:text-3xl font-display font-bold">
                {role === 'dev' ? 'Разработчик' : 'Администратор'} 👋
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="glass card-hover w-11 h-11 rounded-xl flex items-center justify-center text-slate-300">
                <Icon name="Bell" size={18} />
              </button>
              <div className="glass card-hover flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-sm font-bold">J</div>
                <span className="text-sm font-medium hidden sm:block">jusy_dev</span>
              </div>
            </div>
          </header>

          {/* Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="glass card-hover rounded-2xl p-5 animate-fade-in opacity-0"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon name={s.icon} size={20} />
                </div>
                <p className="text-3xl font-display font-bold">{s.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-slate-400">{s.label}</p>
                  <span className="text-xs text-emerald-400 font-medium">{s.delta}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Servers + Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Servers */}
            <section className="xl:col-span-2 glass rounded-2xl p-6 animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Icon name="Server" size={20} className="text-indigo-400" /> Серверы
                </h3>
                <button className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1">
                  Все <Icon name="ChevronRight" size={14} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {SERVERS.map((srv) => (
                  <div key={srv.name} className="group bg-black/20 card-hover rounded-xl p-4 border border-white/5 cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl">{srv.icon}</div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{srv.name}</p>
                        <p className="text-xs text-slate-400">{srv.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Icon name="Users" size={13} /> {srv.members.toLocaleString('ru')}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-glow" /> {srv.online.toLocaleString('ru')} онлайн</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity */}
            <section className="glass rounded-2xl p-6 animate-fade-in opacity-0" style={{ animationDelay: '400ms' }}>
              <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
                <Icon name="Zap" size={20} className="text-fuchsia-400" /> Активность
              </h3>
              <div className="space-y-1">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className={`w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center shrink-0 ${a.color}`}>
                      <Icon name={a.icon} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-tight">
                        <span className="font-semibold">{a.user}</span>{' '}
                        <span className="text-slate-400">{a.action}</span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">{a.target}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90 transition-opacity py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Icon name="LogIn" size={16} /> Войти через Discord
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
