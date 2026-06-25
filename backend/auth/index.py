import json
import os
import urllib.parse
import urllib.request


def handler(event: dict, context) -> dict:
    '''
    Business: Discord OAuth2 авторизация — выдаёт ссылку для входа и обменивает код на профиль пользователя с его серверами.
    Args: event с httpMethod, queryStringParameters (action=login|callback, code, redirect_uri); context с request_id.
    Returns: HTTP-ответ с auth_url для входа или данными пользователя (id, username, avatar, role, guilds).
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

    client_id = os.environ.get('DISCORD_CLIENT_ID', '')
    client_secret = os.environ.get('DISCORD_CLIENT_SECRET', '')
    owner_id = os.environ.get('DISCORD_OWNER_ID', '')

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'login')

    if action == 'login':
        redirect_uri = params.get('redirect_uri', '')
        scope = 'identify guilds'
        auth_url = (
            'https://discord.com/api/oauth2/authorize?'
            + urllib.parse.urlencode({
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': scope,
            })
        )
        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({'auth_url': auth_url}),
        }

    if action == 'callback':
        code = params.get('code', '')
        redirect_uri = params.get('redirect_uri', '')
        if not code:
            return _err(cors_headers, 'Не передан код авторизации')

        token_data = urllib.parse.urlencode({
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        }).encode()

        token_req = urllib.request.Request(
            'https://discord.com/api/oauth2/token',
            data=token_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
        )
        try:
            with urllib.request.urlopen(token_req) as resp:
                token_json = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return _err(cors_headers, f'Ошибка получения токена: {e.read().decode()}')

        access_token = token_json.get('access_token', '')
        if not access_token:
            return _err(cors_headers, f'Discord не вернул токен: {json.dumps(token_json)}')

        user = _discord_get('https://discord.com/api/users/@me', access_token)
        if not user:
            return _err(cors_headers, 'Не удалось получить данные пользователя от Discord')

        guilds = _discord_get('https://discord.com/api/users/@me/guilds', access_token) or []

        is_owner = str(user.get('id')) == str(owner_id)

        admin_guilds = []
        for g in (guilds or []):
            perms = int(g.get('permissions', 0))
            is_admin = (perms & 0x8) == 0x8 or g.get('owner', False)
            if is_owner or is_admin:
                admin_guilds.append({
                    'id': g.get('id'),
                    'name': g.get('name'),
                    'icon': g.get('icon'),
                    'owner': g.get('owner', False),
                })

        avatar_hash = user.get('avatar')
        uid = user.get('id')
        avatar_url = (
            f'https://cdn.discordapp.com/avatars/{uid}/{avatar_hash}.png'
            if avatar_hash else None
        )

        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'id': uid,
                'username': user.get('global_name') or user.get('username'),
                'avatar': avatar_url,
                'access_token': access_token,
                'role': 'dev' if is_owner else 'admin',
                'guilds': admin_guilds,
            }),
        }

    return _err(cors_headers, 'Неизвестное действие')


def _discord_get(url: str, token: str):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError:
        return None


def _err(headers: dict, msg: str) -> dict:
    return {
        'statusCode': 400,
        'headers': {**headers, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': msg}),
    }