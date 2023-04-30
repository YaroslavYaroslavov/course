const os = require('os');
const WebSocket = require('./node_modules/ws');

const networkInterfaces = os.networkInterfaces();
const nonLocalInterfaces = {};

for (let inet in networkInterfaces) {
    const addresses = networkInterfaces[inet];

    for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];

        if (!address.internal) {
            if (!nonLocalInterfaces[inet]) {
                nonLocalInterfaces[inet] = [];
            }
            nonLocalInterfaces[inet].push(address);
        }
    }
}

const currentIp = nonLocalInterfaces['Беспроводная сеть'][1].address;
const server = new WebSocket.Server({ port: 8080 });
if (server) {
    console.log(`Сервер успешно запущен на ip ${currentIp}.`);
}

const clients = [];
const alreadyConnection = [];
let roomIsClose = false;

function removeStringFromArray(arr, str) {
    return arr.filter(function(item) {
        return item !== str;
    });
}

function deleteObjectById(id, arr) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === id) {
            arr.splice(i, 1);
            return true;
        }
    }
    return false;
}

function broadcastMessage(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function handleConnection(socket, req) {
    if (!roomIsClose) {
        if (alreadyConnection.includes(req.rawHeaders[9])) {
            console.log('Попытка повторной регистрации в комнате.');
            const data = {
                status: 'Error',
                msg: 'Вы уже подключены'
            };
            socket.send(JSON.stringify(data));
            socket.close();
            return;
        } else {
            if (clients.length === 2) {
                console.log('Попытка регистрации при полной комнате.');
                const data = {
                    status: 'Error',
                    msg: 'Server is full'
                };
                socket.send(JSON.stringify(data));
                socket.close();
                return;
            } else {
                console.log(req.rawHeaders[9]);
                alreadyConnection.push(req.rawHeaders[9]);
                socket.browserName = req.rawHeaders[9];
            }
        }
    } else {
        console.log('Попытка подключение когда комната закрыта.');
        const data = {
            status: 'Error',
            msg: 'Game is done'
        };
        socket.send(JSON.stringify(data));
        socket.close();
    }

    socket.on('message', (data) => {
        const dataClient = JSON.parse(data.toString());

        if (dataClient.status === 'requestToRegister') {
            console.log('Cоединение установлено');
            socket.id = dataClient.userInfo.id;
            clients.push(socket);
            console.log(clients.length);
            socket.name = dataClient.userInfo.nickname;

            const data = {
                status: 'Connected',
                msg: `Пользователь ${socket.name} успешно подключился`,
                nickname: socket.name,
                id: socket.id,
                clients: clients.length
            };

            socket.send(JSON.stringify(data));
        }

        if (dataClient.status === 'Start') {
            broadcastMessage(JSON.stringify(dataClient));
            roomIsClose = true;
        }

        if (dataClient.status === 'gameOver') {

            broadcastMessage(JSON.stringify(dataClient))
        }

        clients.forEach((client) => {
            if (dataClient.status === 'Stat') {
                if (client.id !== dataClient.userInfo.id) {
                    client.send(JSON.stringify(dataClient))
                }
            }
        })

        clients.forEach((client) => {
            if (dataClient.status === 'gameField') {
                if (socket.id !== client.id) {
                    client.send(JSON.stringify(dataClient))
                }
            }
        })
    });

    socket.on('close', (code) => {
        if (code === 1005) {
            return
        }
        deleteObjectById(socket.id, clients)
        alreadyConnection = removeStringFromArray(alreadyConnection, socket.browserName)
        console.log(`Пользователь с ID${socket.id} отключен`)
        if (alreadyConnection.length === 0) {
            roomIsClose = false
            console.log('ПОДКЛЮЧИТСЯ МОЖНО')
        }
        const data = {
            status: 'Disconnected',
            id: socket.id,
            name: socket.name,
            msg: `Пользователь ${socket.name} отключился`
        }
        broadcastMessage(JSON.stringify(data))
    })

}