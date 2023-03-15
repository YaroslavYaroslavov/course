const send = document.querySelector('.btn')
const input = document.querySelector('input')
const socket = new WebSocket('wss://localhost:8080')
    // const socket = new WebSocket('wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self')
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

send.addEventListener('click', () => {
    console.log('Отправлено серверу.')
    socket.send(input.value.toString())
})