const os = require('os');
const WebSocket = require('./node_modules/ws')
let networkInterfaces = os.networkInterfaces();
let roomIsClose = false
let nonLocalInterfaces = {};
for (let inet in networkInterfaces) {
    let addresses = networkInterfaces[inet];
    for (let i = 0; i < addresses.length; i++) {
        let address = addresses[i];
        if (!address.internal) {
            if (!nonLocalInterfaces[inet]) {
                nonLocalInterfaces[inet] = [];
            }
            nonLocalInterfaces[inet].push(address);
        }
    }
}

const currentIp = nonLocalInterfaces['Беспроводная сеть'][1].address;
const server = new WebSocket.Server({ port: 8080 })
if (server) {
    console.log(`Сервер успешно запущен на ip ${currentIp}.`)
}


const clients = [];


function removeStringFromArray(arr, str) {
    return arr.filter(function(item) {
        return item !== str; // оставить только те элементы, которые не равны заданной строке
    });
}

function deleteObjectById(id, arr) {
    for (let i = 0; i < arr.length; i++) { // перебираем все элементы массива
        if (arr[i].id === id) { // если находим объект с нужным id
            arr.splice(i, 1); // удаляем его из массива
            return true; // возвращаем true, если объект удален успешно
        }
    }
    return false; // возвращаем false, если объект с таким id не найден
}


function registerToRoom(user) {
    const data = {
        status: 'Suc',
        msg: `Пользователь ${user} успешно подключился`
    }
    socket.send(JSON.stringify(data))
}

function broadcastMessage(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
let alredyConnection = []
server.on('connection', (socket, req) => {
    if (!roomIsClose) {
        if (alredyConnection.includes(req.rawHeaders[9])) {
            console.log('Попытка повторной регистрации в комнате.')
            const data = {
                status: 'Error',
                msg: 'Вы уже подключены'
            }
            socket.send(JSON.stringify(data))
            socket.close()
            return
        } else {
            if (clients.length === 2) {
                console.log('Попытка регистрации при полной комнате.')
                const data = {
                    status: 'Error',
                    msg: 'Server is full'
                }
                socket.send(JSON.stringify(data))
                socket.close()
                return
            } else {
                console.log(req.rawHeaders[9])
                alredyConnection.push(req.rawHeaders[9])
                socket.browserName = req.rawHeaders[9]
            }
        }
    } else {
        console.log('Попытка подключение когда комната закрыта.')
        const data = {
            status: 'Error',
            msg: 'Game is done'
        }
        socket.send(JSON.stringify(data))
        socket.close()
    }



    socket.on('message', (data) => {
        const dataClient = JSON.parse(data.toString())
        if (dataClient.status === 'requestToRegister') {
            console.log('Cоединение установлено')
            socket.id = dataClient.userInfo.id
            clients.push(socket)
            console.log(clients.length)
            socket.name = dataClient.userInfo.nickname
            console.log(dataClient)
            const data = {
                status: 'Connected',
                msg: `Пользователь ${socket.name} успешно подключился`,
                nickname: socket.name,
                id: socket.id,
                clients: clients.length
            }

            // console.log(data)
            // console.log(dataClient.userInfo.nickname)
            socket.send(JSON.stringify(data))

            // broadcastMessage(JSON.stringify(data))
        }
        if (dataClient.status === 'Start') {
            broadcastMessage(JSON.stringify(dataClient))
            roomIsClose = true
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
        alredyConnection = removeStringFromArray(alredyConnection, socket.browserName)
        console.log(`Пользователь с ID${socket.id} отключен`)
        if (alredyConnection.length === 0) {
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

});