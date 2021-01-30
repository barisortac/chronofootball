import React, {useEffect, useRef, useState} from 'react'
import {
    Badge,
    Button,
    ChakraProvider,
    Flex,
    Grid,
    Input,
    InputGroup,
    InputLeftAddon,
    Text
} from '@chakra-ui/react'
import io from "socket.io-client";

const socket = io("http://0.0.0.0:8000");

export const Game = () => {
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
    const [lastShoot, setLastShoot] = useState<any>(null);
    const [turn, setTurn] = useState<string>('');
    const [side, setSide] = useState<string>('');
    const [winner, setWinner] = useState<any>(null);
    const clockRef: any = useRef();
    const shootRef: any = useRef();

    const [room, setRoom] = useState<any>(null);
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
        setLastShoot(scoreInt);
        let payload = {room: room, side: side, score: scoreInt};
        socket.emit("score", payload);
    };


    const queryRooms = () => {
        socket.emit("query rooms", (response: any) => {
            console.log("rooms");
            setRoomList(response);
            // alert(response);
            // if (response['result']){
            //     setSide(response['side']);
            // }
        });
    };


    const joinRoom = (room: any) => {
        socket.emit("join room", room, (response: any) => {
            console.log(response)
            if (response['result']) {
                setSide(response['side']);
            }
            setRoom(room);
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
        let payload = {room: room, side: side};
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
            setWinner(data['winner']);
        });

        queryRooms();
    }, [])


    useEffect(
        () => {
            if (scoreX !== 0 && scoreY !== 0) {
                if (winner === "X" || winner === "Y") {
                    shootRef.current.disabled = true;
                    setNewGame(false);
                }
            }
        }, [winner]
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
        <ChakraProvider resetCSS>
            <Flex
                flexDirection="row"
                justifyContent="center"
                alignItems="flex-start"
            >
                {/*TODO: open it when rooms will be implemented*/}
                {/*{*/}
                {/*    roomList && roomList.map(e => e.room_name &&*/}
                {/*      <Button*/}
                {/*        key={e.id}*/}
                {/*        placeholder={e.room_name}*/}
                {/*        value={e.room_name}*/}
                {/*        readOnly*/}
                {/*      >*/}
                {/*          {e.room_name}*/}
                {/*      </Button>*/}
                {/*    )*/}
                {/*}*/}
            </Flex>

            <Flex
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                // m="1em"
            >
                <Flex
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    m="1em"
                >
                    <Flex
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                        width="50em"
                    >
                        <Text fontSize="4xl" fontWeight="bold">
                            ⚡️ChronoFootball
                        </Text>
                        <Badge variant="subtle" colorScheme="purple" ml={1}>
                            ALFA
                        </Badge>
                    </Flex>
                    <Flex
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text fontSize="3xl" fontWeight="bold">
                            Winner: {winner ? "Congrats! ->" + winner : "Not yet.."}
                        </Text>
                    </Flex>
                    <InputGroup display="flex" justifyContent="center"
                                alignItems="center">
                        <InputLeftAddon>Counter</InputLeftAddon>
                        <Input display="flex" maxWidth="5em"
                               ref={clockRef}
                               placeholder={clock.toFixed(3)}
                               value={clock.toFixed(3)}
                               style={{width: '100px'}}
                               readOnly
                        />
                    </InputGroup>
                    <Text fontWeight="bold" fontSize="md">
                        Last Shoot: {lastShoot}
                    </Text>
                    <Text fontWeight="bold" fontSize="md">
                        Room is: {room}
                    </Text>
                    <Text fontWeight="bold" fontSize="md">
                        Rule: if the shoot is bigger than 2, it counts as score
                    </Text>
                    <Text fontWeight="bold" fontSize="md">
                        Match Point: {matchPoint}
                    </Text>
                    <Button
                        variant="solid"
                        size="lg"
                        colorScheme="blue"
                        display="flex"
                        justifyContent="flex-end"
                        mt={3}
                        onClick={() => joinRoom('room_1')}
                    >
                        Join Room
                    </Button>
                </Flex>
                <Grid
                    p={5}
                    templateColumns="repeat(auto-fit, minmax(350px, 1fr))"
                    display="grid"
                    justifyContent="space-around"
                    flexDirection="row"
                    alignItems="stretch"
                    fontWeight="bold"
                    fontSize="2xl"
                >
                    <Text backgroundColor={winner === "X" ? "teal.200" : ""}>
                        X Score: {scoreX}
                    </Text>
                    <Text backgroundColor={winner === "Y" ? "teal.200" : ""}>
                        Y Score: {scoreY}
                    </Text>
                </Grid>
                <Grid
                    p={5}
                    templateColumns="repeat(auto-fit, minmax(350px, 1fr))"
                    display="grid"
                    justifyContent="space-around"
                    flexDirection="row"
                    alignItems="stretch"
                    fontWeight="bold"
                    fontSize="2xl"
                >
                    <Text>You Are:{side}</Text>
                    <Text>Turn: {turn}</Text>
                </Grid>
                <Grid
                    p={5}
                    gap={6}
                    templateColumns="repeat(auto-fit, minmax(350px, 1fr))"
                >
                    <Button variant="solid" size="md" colorScheme="green"
                            ref={shootRef}
                            disabled={turn !== side}
                            onClick={() => addMove()}
                    >
                        Shoot!
                    </Button>
                    <Button variant="solid" size="md" colorScheme="orange"
                            onClick={(e: any) => startCounter(e.target.value)}
                            disabled={room == null}
                    >
                        Start Counter
                    </Button>
                    <Button variant="solid" size="md" colorScheme="orange"
                            disabled={!winner}
                            onClick={(e: any) => resetGame(e.target.value)}
                    >
                        {!winner && !newGame ? 'Reset Game' : 'Reset Game - Waiting for other player..'}
                    </Button>
                </Grid>
            </Flex>
            <Text>
                <Text fontWeight="bold" fontSize="lg">
                    Room status: {roomStatus}
                    <p>{users.map((user) => <li>{user}</li>)}</p>
                </Text>
                {"Last Moves:" + moves}
            </Text>
        </ChakraProvider>
    );
}