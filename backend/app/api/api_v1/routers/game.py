from copy import deepcopy
import json

import socketio

# import sentry_sdk
# from db.session import Session

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)

user_and_room = {}
number_of_rooms = 15
number_of_players_in_a_room = 2
number_of_players = number_of_rooms * 2
match_point = 3
goal_threshold = 2

room_list = {}

# Generate rooms
for room_no in range(1, number_of_rooms + 1):
    room_list.update(
        {
            f'room_{room_no}': {
                # turn -> True == X, False == Y
                'id': room_no,
                'last_moves': [],
                'turn': '',
                'is_full': False,
                'winner': None,
                'X': {
                    'sid': '',
                    'score': 0,
                    'want_rematch': False
                },
                'Y': {
                    'sid': '',
                    'score': 0,
                    'want_rematch': False
                }
            }
        }
    )


@sio.on('connect')
async def on_connect(sid, environ):
    """
    client connects to socket
    """
    print('user connected')
    print(sid, environ)


@sio.on("query rooms")
async def do_query_rooms(sid):
    print(f'user query for rooms, sid: {sid}')
    global room_list
    room_template = {'room_name': '', 'id': ''}
    room_list_serialized = []

    for i, r in room_list.items():
        _room = deepcopy(room_template)
        _room['id'] = r['id']
        _room['room_name'] = i
        room_list_serialized.append(_room)

    # return await sio.emit('query rooms', data=room_list_serialized, to=sid)
    return room_list_serialized


@sio.on("message")
async def send_or_take_msg(sid, msg):
    """
    communication between server and client
    """
    print(f"message is sent to {sid}, msg:{msg}")
    await sio.emit('message', data=msg, to=sid)
    # await sio.send("hello", to=sid)


@sio.on("score")
async def save_score(sid, data):
    """
    communication between server and client
    """
    global room_list

    room = data['room']
    score = data['score']

    if data['side'] == 'X':
        if int(score) > goal_threshold:
            room_list[room]['X']['score'] += 1
        room_list[room]['turn'] = 'Y'
    else:
        if int(score) > goal_threshold:
            room_list[room]['Y']['score'] += 1
        room_list[room]['turn'] = 'X'

    score_x = room_list[room]['X']['score']
    score_y = room_list[room]['Y']['score']

    if score_x == match_point:
        room_list[room]['winner'] = "X"
    elif score_y == match_point:
        room_list[room]['winner'] = "Y"

    room_list[room]['last_moves'].append(score)

    return await send_room_status(room)


@sio.on("reset game")
async def reset_game(sid, data):
    """
    communication between server and client
    """
    global room_list

    room = data['room']

    if data['side'] == 'X':
        room_list[room]['X']['want_rematch'] = True
        room_list[room]['turn'] = 'X'
    else:
        room_list[room]['Y']['want_rematch'] = True
        room_list[room]['turn'] = 'Y'

    if room_list[room]['X']['want_rematch'] and room_list[room]['Y']['want_rematch']:
        room_list[room]['X']['score'] = 0
        room_list[room]['X']['want_rematch'] = False
        room_list[room]['Y']['score'] = 0
        room_list[room]['Y']['want_rematch'] = False
        room_list[room]['winner'] = None
        room_list[room]['last_moves'] = []

    return await send_room_status(room)


@sio.on('join room')
async def join_room(sid, room):
    """
    client wants to join in a room
    """
    global room_list
    global user_and_room

    if sid in user_and_room:
        await send_or_take_msg(
            sid,
            f"You are already in a room: {user_and_room[sid]}"
        )
        return {'result': False}

    if len(user_and_room) == number_of_players:
        await send_or_take_msg(sid, f"Rooms are full!")
        return {'result': False}

    player_count_in_room = sum([
        True if room_list[room][j]['sid']
        else False
        for j in ['X', 'Y']
    ])

    if player_count_in_room >= number_of_players:
        await send_or_take_msg(sid, f"Room is full!")
        return {'result': False}

    sio.enter_room(sid, room)
    user_and_room[sid] = room
    # print(user_and_room)

    if not room_list[room]['X']['sid']:
        room_list[room]['X']['sid'] = sid
        side = 'X'
    else:
        room_list[room]['Y']['sid'] = sid
        side = 'Y'

    room_list[room]['turn'] = 'X'

    print(f"{sid} has joined room {room} as {side}")

    await send_room_status(room)

    print(f'#################### side: {side}')
    return {
        'result': True,
        'side': side,
    }


async def send_room_status(room):
    global room_list

    room_list_serialized = []
    room_serialized = json.dumps(room_list[room])
    room_list_serialized.append(room_serialized)

    turn = room_list[room]['turn']
    score_x = room_list[room]['X']['score']
    score_y = room_list[room]['Y']['score']
    last_moves = room_list[room]['last_moves']
    winner = room_list[room]['winner']

    print(room_list_serialized)

    return await sio.emit('room status', data={
        'turn': turn,
        'room': room,
        'scoreX': score_x,
        'scoreY': score_y,
        'lastMoves': last_moves,
        'roomStatus': room_list_serialized,
        'matchPoint': match_point,
        'winner': winner
    }, room=room)


@sio.event
async def disconnect(sid):
    global user_and_room
    global room_list

    if sid in user_and_room:
        room = user_and_room[sid]
        x = sio.leave_room(sid, room=room)
        print(x)
        user_and_room.pop(sid)

        temp_room_list = deepcopy(room_list)
        for i in temp_room_list[room]:
            if i in ['X', 'Y']:
                if temp_room_list[room][i]['sid'] == sid:
                    room_list[room][i]['sid'] = ''
                    room_list[room][i]['score'] = 0
                    room_list[room][i]['last_moves'] = []

        print(f"{sid} has disconnected from room {room}")
        await send_room_status(room)

        # await sio.disconnect(sid)
