import React, {FC, useEffect, useRef, useState} from "react";
import io from "socket.io-client";

const socket = io("http://0.0.0.0:8000");

// @ TODO: skorları backendte gönder orayla sync olsun.

export const Game: FC = () => {
    type roomType = {
        id: number;
        room_name: string;
    }

    type roomListType = {
        [key: string]: roomType;
    }

    const [matchPoint, setmatchPoint] = useState<number>(0);
    const [clock, setClock] = useState<number>(0);
    const [gameIsActive, setIsActive] = useState<boolean>(false);
    const [moves, setMoves] = useState<any>([]);
    const [scoreX, setScoreX] = useState<any>(0);
    const [scoreY, setScoreY] = useState<any>(0);
    const [turn, setTurn] = useState<any>(true);
    const [isX, setIsX] = useState<any>(true);
    const [winner, setWinner] = useState<any>(null);
    const clockRef: any = useRef();
    const shootRef: any = useRef();

    const [room, setRoom] = useState(null);
    const [roomList, setRoomList] = useState<roomType[]>([]);
    const [roomStatus, setRoomStatus] = useState([]);
    const [users, setUsers] = useState([]);

    const [newGame, setNewGame] = useState(false);

    // const [endpoint, setEndPoint] = useState("http://localhost:8100")
    // let socket = io.connect(endpoint);


    const addMove = () => {
        // if (!gameIsActive){
        //     alert("Game is not started yet!");
        //     return;
        // }
        let move = clockRef.current.value.toString();
        let score = move[move.length - 1];

        // setMoves(scores => [...scores, score]);
        //
        // if (moves.length === 10) {
        //     moves.shift()
        // }

        let scoreInt = parseInt(score);
        let payload = {room: room, isX: isX, score: score};
        socket.emit("score", payload);
    };


    const queryRooms = () => {
        socket.emit("query rooms", (response: any) => {
            console.log("rooms");
            setRoomList(response);
            // alert(response);
            // if (response['result']){
            //     setIsX(response['isX']);
            // }
        });
    };


    const joinRoom = (room: any) => {
        socket.emit("join room", room, (response: any) => {
            // console.log(response)
            if (response['result']) {
                setIsX(response['isX']);
            }
        });
    };


    const startCounter = (value: any) => {
        setClock(clock + 1);
        setIsActive(true);
    };


    const resetGame = (value: any) => {
        setScoreX(0);
        setScoreY(0);
        setMoves([]);
        setClock(0);
        setWinner(null);
        setIsActive(false);
        shootRef.current.disabled = false;
        let payload = {room: room, isX: isX};
        socket.emit("reset game", payload);
    };

    useEffect(() => {
        // socket.on("query rooms", (data: any) => {
        //     setRoomList(data);
        //     console.log("roomList");
        //     console.log(data);
        //     console.log(roomList);
        // });

        socket.on("message", (data: any) => {
            alert(data);
        });

        socket.on('users', (data: any) => {
            setUsers(data);
        });

        socket.on('room status', (data: any) => {
            console.log(data);
            setRoom(data['room']);
            setRoomStatus(data['roomStatus']);
            setTurn(data['turn']);
            setScoreX(data['scoreX']);
            setScoreY(data['scoreY']);
            setMoves(data['lastMoves']);
            setmatchPoint(data['matchPoint']);
        });

        queryRooms();
    }, [])


    useEffect(
        () => {
            if ((scoreX === matchPoint || scoreY === matchPoint) && (scoreX !== 0 && scoreY !== 0)) {
                isX ? setWinner("X") : setWinner("Y")
                shootRef.current.disabled = true;
                setNewGame(false);
            }
        }, [scoreX, scoreY]
    );


    useEffect(
        () => {
            console.log(room)
        }, [room]
    );


    useEffect(
        () => {
            let interval: any;
            if (gameIsActive) {
                interval = setInterval(() => {
                    if (clock > 10) {
                        setClock(0);
                    }
                    setClock(clock => clock + 0.513563);
                }, 50)
            } else if (!gameIsActive && clock !== 0) {
                clearInterval(interval);
            }
            return () => clearInterval(interval);
        }, [gameIsActive, clock]
    );


    return (
        <>
            <div style={
                {display: "flex"}
            }>
                {
                    roomList && roomList.map(e => e.room_name &&
                      <input
                        type="button"
                        key={e.id}
                        placeholder={e.room_name}
                        value={e.room_name}
                          // style={{width: '100px'}}
                        readOnly
                      />
                    )
                    // roomList.map(e => <i>{e.id} {e.room_name}</i>)
                }
            </div>

            <div style={
                {display: "block"}
            }>

                <input
                    type="text"
                    ref={clockRef}
                    placeholder={clock.toFixed(3)}
                    value={clock.toFixed(3)}
                    style={{width: '100px'}}
                    readOnly
                />
                <button ref={shootRef} disabled={turn !== isX}
                        style={{width: '200px', height: '200px'}}
                        onClick={() => addMove()}>Shoot!
                </button>
                <button style={{width: '200px', height: '200px'}}
                        onClick={(e: any) => startCounter(e.target.value)}
                        disabled={room === null}>Start Counter!
                </button>
                <button style={{width: '200px'}} disabled={!winner}
                        onClick={(e: any) => resetGame(e.target.value)}>{!winner && !newGame ? 'Reset Game' : 'Waiting for other player..'}</button>
                <div className="scoreX">
                    {"Last Moves:" + moves}
                </div>
                <div className="scoreBoard">
                    <p>Turn: {turn ? "X" : "Y"}</p>
                    <p>You are: {isX ? "X" : "Y"}</p>
                    <p>X score: {scoreX}</p>
                    <p>Y score: {scoreY}</p>
                    <p>Winner: {winner ? "Congrats! ->" + winner : "Not yet.."} </p>
                </div>
                {/*<button style={{width: '100px'}} onClick={() => makeConnection()}>Make Connection!</button>*/}
                <button style={{width: '100px'}}
                        onClick={() => joinRoom('room_1')}>Join Room
                </button>
                <p>Room is {room}</p>
                <p>Room status {roomStatus}</p>
                <p>{users.map((user) => <li>{user}</li>)}</p>
            </div>
        </>
    );
}

// export default Game;
