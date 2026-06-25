const AUTH_URL = 'https://functions.poehali.dev/0696402e-5b01-4885-8bb8-61ab7be01761';
const BOT_URL = 'https://functions.poehali.dev/4257ae56-4cf2-4df5-9a8b-ebdd912d8663';

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  avatar: string | null;
  access_token: string;
  role: 'dev' | 'admin';
  guilds: Guild[];
}

export interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  members: number;
  online: number;
}

export interface Channel {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  color: number;
}

export interface Member {
  id: string;
  username: string;
  avatar: string | null;
  roles: string[];
}

export function getRedirectUri(): string {
  return `${window.location.origin}/`;
}

export async function getLoginUrl(): Promise<string> {
  const res = await fetch(`${AUTH_URL}?action=login&redirect_uri=${encodeURIComponent(getRedirectUri())}`);
  const data = await res.json();
  return data.auth_url;
}

export async function handleCallback(code: string): Promise<AuthUser> {
  const res = await fetch(
    `${AUTH_URL}?action=callback&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(getRedirectUri())}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as AuthUser;
}

export async function getGuildInfo(guildId: string): Promise<GuildInfo> {
  const res = await fetch(`${BOT_URL}?action=guild&guild_id=${guildId}`);
  return res.json();
}

export async function getChannels(guildId: string): Promise<Channel[]> {
  const res = await fetch(`${BOT_URL}?action=channels&guild_id=${guildId}`);
  const data = await res.json();
  return data.channels || [];
}

export async function getMembers(guildId: string): Promise<{ members: Member[]; roles: Role[] }> {
  const res = await fetch(`${BOT_URL}?action=members&guild_id=${guildId}`);
  const data = await res.json();
  return { members: data.members || [], roles: data.roles || [] };
}

export async function sendMessage(channelId: string, content: string, embed?: object): Promise<boolean> {
  const res = await fetch(BOT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send_message', channel_id: channelId, content, embed }),
  });
  const data = await res.json();
  return !!data.success;
}

export async function botAction(
  action: 'add_role' | 'remove_role' | 'kick' | 'ban',
  payload: Record<string, string>
): Promise<boolean> {
  const res = await fetch(BOT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  return !!data.success;
}

const STORAGE_KEY = 'jusy_user';

export function saveUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}
