const WebSocket = require('./node_modules/ws')

const server = new WebSocket.Server({ port: 8080 })
const clients = [];

function generateUniqueId() {
    const timestamp = +new Date(); // получаем текущую метку времени в миллисекундах
    const randomNum = Math.floor(Math.random() * 10000); // генерируем случайное число от 0 до 9999
    return `${timestamp}${randomNum}`; // объединяем метку времени и случайное число в одну строку и возвращаем
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
let alredyConnection = ''
server.on('connection', (socket, req) => {
    if (req.rawHeaders[9] === alredyConnection) {
        console.log('Попытка повторной регистрации в комнате.')
        const data = {
            status: 'Error',
            msg: 'Вы уже подключены'
        }
        socket.send(JSON.stringify(data))

        return
    } else {
        alredyConnection = req.rawHeaders[9]
    }
    if (clients.length === 2) {
        console.log('Попытка регистрации при полной комнате.')
        const data = {
            status: 'Error',
            msg: 'Server is full'
        }
        socket.send(JSON.stringify(data))

        return
    }

    socket.on('message', (data) => {
        const dataClient = JSON.parse(data.toString())
        if (dataClient.status === 'requestToRegister') {
            console.log('Cоединение установлено')
            socket.id = generateUniqueId()
            clients.push(socket)
            console.log(clients.length)
            socket.name = dataClient.userInfo.nickname
            const data = {
                status: 'Suc',
                msg: `Пользователь ${socket.name} успешно подключился`,
                nickname: socket.name,
                id: socket.id,
                clients: clients.length
            }
            socket.send(JSON.stringify(data))
        }
        if (dataClient.status === 'Start') {
            broadcastMessage(JSON.stringify(dataClient))
        }
        if (dataClient.status === 'gameOver') {
            broadcastMessage(JSON.stringify(dataClient))
        }



        clients.forEach((client) => {
            if (dataClient.status === 'gameField') {
                if (socket.id !== client.id) {
                    client.send(JSON.stringify(dataClient))
                }
            }



        })
    });
    socket.on('close', () => {
        deleteObjectById(socket.id, clients)
        console.log(clients.length)
    })

});