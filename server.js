const WebSocket = require('./node_modules/ws')
const server = new WebSocket.Server({ port: 8080 })
server.on('connection', (socket) => {
    console.log('соединение установлено')
    socket.send('Добро пожаловать')
    socket.on('message', (data) => {
        console.log('Сообщение получено:', data.toString());
        socket.send(`${data.toString()}`)
    });

});