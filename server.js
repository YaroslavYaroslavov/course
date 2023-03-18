const WebSocket = require('./node_modules/ws')

const server = new WebSocket.Server({ port: 8080 })
const clients = [];

function broadcastMessage(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.on('connection', (socket) => {
    console.log('соединение установлено')
    socket.id = clients.length + 1
    clients.push(socket)
        // clients.push(socket)

    // console.log(server.clients)
    // socket.send('Добро пожаловать')
    socket.on('message', (data) => {
        // console.log('Сообщение получено:', data.toString());
        clients.forEach((client) => {
                if (socket.id !== client.id) {
                    client.send(Buffer(data));
                    // client.send(JSON.stringify(data).toString)
                }
            })
            // console.log(data.toString())
            // let msg = data.toString()
            // broadcastMessage(Buffer(data))
    });

});