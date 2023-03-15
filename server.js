const WebSocket = require('./node_modules/ws')
const server = new WebSocket.Server({ port: 8080 })

function broadcastMessage(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
server.on('connection', (socket) => {
    console.log('соединение установлено')
    socket.send('Добро пожаловать')
    socket.on('message', (data) => {
        console.log('Сообщение получено:', data.toString());
        broadcastMessage(data.toString())
    });

});