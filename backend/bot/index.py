import json
import os
import urllib.request
import urllib.error

API = 'https://discord.com/api/v10'


def handler(event: dict, context) -> dict:
    '''
    Business: Управление ботом Jusy через Discord API — серверы, каналы, участники, отправка сообщений и модерация (кик/бан).
    Args: event с httpMethod, queryStringParameters (action), body (для POST); context с request_id.
    Returns: HTTP-ответ с данными запрошенного ресурса или результатом действия.
    '''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    bot_token = os.environ.get('DISCORD_BOT_TOKEN', '')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET':
        if action == 'guild':
            gid = params.get('guild_id', '')
            data = _bot_get(f'{API}/guilds/{gid}?with_counts=true', bot_token)
            if data is None:
                return _err(cors_headers, 'Бот не состоит на этом сервере или нет доступа')
            return _ok(cors_headers, {
                'id': data.get('id'),
                'name': data.get('name'),
                'icon': _guild_icon(data.get('id'), data.get('icon')),
                'members': data.get('approximate_member_count', 0),
                'online': data.get('approximate_presence_count', 0),
            })

        if action == 'channels':
            gid = params.get('guild_id', '')
            data = _bot_get(f'{API}/guilds/{gid}/channels', bot_token) or []
            channels = [
                {'id': c.get('id'), 'name': c.get('name')}
                for c in data if c.get('type') == 0
            ]
            return _ok(cors_headers, {'channels': channels})

        if action == 'members':
            gid = params.get('guild_id', '')
            data = _bot_get(f'{API}/guilds/{gid}/members?limit=100', bot_token) or []
            roles_data = _bot_get(f'{API}/guilds/{gid}/roles', bot_token) or []
            roles = [
                {'id': r.get('id'), 'name': r.get('name'), 'color': r.get('color', 0)}
                for r in roles_data if r.get('name') != '@everyone'
            ]
            members = []
            for m in data:
                u = m.get('user', {})
                if u.get('bot'):
                    continue
                members.append({
                    'id': u.get('id'),
                    'username': u.get('global_name') or u.get('username'),
                    'avatar': _avatar(u.get('id'), u.get('avatar')),
                    'roles': m.get('roles', []),
                })
            return _ok(cors_headers, {'members': members, 'roles': roles})

        if action == 'roles':
            gid = params.get('guild_id', '')
            data = _bot_get(f'{API}/guilds/{gid}/roles', bot_token) or []
            roles = [
                {'id': r.get('id'), 'name': r.get('name'), 'color': r.get('color', 0)}
                for r in data if r.get('name') != '@everyone'
            ]
            return _ok(cors_headers, {'roles': roles})

        return _err(cors_headers, 'Неизвестное действие')

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        act = body.get('action', '')

        if act == 'send_message':
            channel_id = body.get('channel_id', '')
            content = body.get('content', '')
            embed = body.get('embed')
            payload = {}
            if content:
                payload['content'] = content
            if embed:
                payload['embeds'] = [embed]
            res = _bot_post(f'{API}/channels/{channel_id}/messages', bot_token, payload)
            if res is None:
                return _err(cors_headers, 'Не удалось отправить сообщение')
            return _ok(cors_headers, {'success': True, 'message_id': res.get('id')})

        if act == 'add_role':
            gid = body.get('guild_id', '')
            uid = body.get('user_id', '')
            rid = body.get('role_id', '')
            ok = _bot_put(f'{API}/guilds/{gid}/members/{uid}/roles/{rid}', bot_token)
            return _ok(cors_headers, {'success': ok})

        if act == 'remove_role':
            gid = body.get('guild_id', '')
            uid = body.get('user_id', '')
            rid = body.get('role_id', '')
            ok = _bot_delete(f'{API}/guilds/{gid}/members/{uid}/roles/{rid}', bot_token)
            return _ok(cors_headers, {'success': ok})

        if act == 'kick':
            gid = body.get('guild_id', '')
            uid = body.get('user_id', '')
            ok = _bot_delete(f'{API}/guilds/{gid}/members/{uid}', bot_token)
            return _ok(cors_headers, {'success': ok})

        if act == 'ban':
            gid = body.get('guild_id', '')
            uid = body.get('user_id', '')
            ok = _bot_put(f'{API}/guilds/{gid}/bans/{uid}', bot_token)
            return _ok(cors_headers, {'success': ok})

        return _err(cors_headers, 'Неизвестное действие')

    return _err(cors_headers, 'Метод не поддерживается')


def _bot_headers(token: str) -> dict:
    return {'Authorization': f'Bot {token}', 'Content-Type': 'application/json'}


def _bot_get(url: str, token: str):
    req = urllib.request.Request(url, headers=_bot_headers(token))
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError:
        return None


def _bot_post(url: str, token: str, payload: dict):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers=_bot_headers(token), method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError:
        return None


def _bot_put(url: str, token: str) -> bool:
    req = urllib.request.Request(url, data=b'{}', headers=_bot_headers(token), method='PUT')
    try:
        urllib.request.urlopen(req)
        return True
    except urllib.error.HTTPError:
        return False


def _bot_delete(url: str, token: str) -> bool:
    req = urllib.request.Request(url, headers=_bot_headers(token), method='DELETE')
    try:
        urllib.request.urlopen(req)
        return True
    except urllib.error.HTTPError:
        return False


def _avatar(uid, h):
    return f'https://cdn.discordapp.com/avatars/{uid}/{h}.png' if h else None


def _guild_icon(gid, h):
    return f'https://cdn.discordapp.com/icons/{gid}/{h}.png' if h else None


def _ok(headers: dict, data: dict) -> dict:
    return {
        'statusCode': 200,
        'headers': {**headers, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(data),
    }


def _err(headers: dict, msg: str) -> dict:
    return {
        'statusCode': 400,
        'headers': {**headers, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': msg}),
    }
