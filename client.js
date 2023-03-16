const send = document.querySelector('.btn')
const input = document.querySelector('.msg')
const ipInput = document.querySelector('.ip_input')
const ipBtn = document.querySelector('.btn_ip')

let link = ''
let socket = {}
ipBtn.addEventListener('click', () => {
        link = `ws://${ipInput.value}:8080`
        socket = new WebSocket(link)
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
    })
    // const socket = new WebSocket('ws://192.168.43.25:8080')