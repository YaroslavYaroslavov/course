const socket = new WebSocket('ws://localhost:8080')
let time = null
socket.onopen = function(event) {
    time = new Date()
    console.log(`Соединение установлено в ${time}`);
};

socket.onmessage = function(event) {
    console.log('От сервера пришло:', event.data);
};

socket.onclose = function(event) {
    console.log('Соединение прервано!');
};
const send = document.querySelector('.btn')
send.addEventListener('click', () => {
    console.log('Отправлено серверу.')
    socket.send('Привет сервак')
})