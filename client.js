const send = document.querySelector('.btn')
const input = document.querySelector('.msg')
const ipInput = document.querySelector('.ip_input')
const ipBtn = document.querySelector('.btn_ip')
const nicknameInput = document.querySelector('.nicknameInput')
const nickBtn = document.querySelector('.nickBtn')
const startBTN = document.querySelector('.startGame')


const yourMaxScoreElem = document.querySelector('.yourMaxScore')
const yourLastScoreElem = document.querySelector('.yourLastScore')
const oppMaxScoreElem = document.querySelector('.opponentMaxScore')
const oppLastScoreElem = document.querySelector('.opponentLastScore')

const yourNick = document.querySelector('.yourName')
const oppNick = document.querySelector('.opponentName')

const loginPage = document.querySelector('.loginPage')
const gamePage = document.querySelector('.gamePage')

const gameOpp = document.querySelector('.fieldOpponent')

nicknameInput.value = localStorage.getItem('tetrisName') || ''

let user = {}

let nicknameSession = ''
const createLocalStorage = () => {
    if (!localStorage.getItem('maxScore')) {
        console.log('Нет записи')
        localStorage.setItem('maxScore', 0)
    } else {
        yourMaxScoreElem.innerHTML = `Ваш максимальный счет: ${localStorage.getItem('maxScore')}`
    }
    if (!localStorage.getItem('lastScore')) {
        console.log('Нет записи')
        localStorage.setItem('lastScore', 0)
    } else {
        yourLastScoreElem.innerHTML = `Ваш последний счет: ${localStorage.getItem('lastScore')}`
    }
}
createLocalStorage()

const getRecordScore = () => {
    const scoreCounterElem = document.querySelector('.score-field')
    const lastScore = Number(scoreCounterElem.textContent)
    const maxScore = Number(localStorage.getItem('maxScore'))
    localStorage.setItem('lastScore', lastScore)
    if (maxScore < lastScore) {
        console.log('12312312313233123')
        localStorage.setItem('maxScore', lastScore)
    }

}

function generateUniqueId() {
    const timestamp = +new Date(); // получаем текущую метку времени в миллисекундах
    const randomNum = Math.floor(Math.random() * 10000); // генерируем случайное число от 0 до 9999
    return `${timestamp}${randomNum}`; // объединяем метку времени и случайное число в одну строку и возвращаем
}

let gameIsDone = false
let socket = null
let canselGame = () => {

}

ipBtn.addEventListener('click', () => {
    link = `ws://${ipInput.value}:8080`
    socket = new WebSocket(link)
    let time = null

    socket.onopen = function(event) {
        time = new Date()
        console.log(`Соединение установлено в ${time}`);


        user = {
            nickname: nicknameInput.value || 'Guest',
            id: generateUniqueId(),
            lastGameMaxScore: localStorage.getItem('maxScore'),
            bestGameMaxScore: localStorage.getItem('lastScore'),
        }

        const data = {
            status: 'requestToRegister',
            userInfo: user,

        }
        socket.send(JSON.stringify(data))

        loginPage.style.display = 'none'
        gamePage.style.display = 'flex'
        nicknameSession = user.nickname
    };

    socket.onmessage = function(event) {
        const clientData = JSON.parse(event.data)
        if (clientData.status === 'Stat') {
            oppNick.innerHTML = `${clientData.userInfo.nickname}(Противник)`
            oppLastScoreElem.innerHTML = `Счет в последней игре: ${clientData.userInfo.lastGameMaxScore}`
            oppMaxScoreElem.innerHTML = `Максимальный счет: ${clientData.userInfo.bestGameMaxScore}`
        }
        if (clientData.status === 'Connected') {


            if (clientData.clients === 2) {
                const data = { status: 'Start' }
                socket.send(JSON.stringify(data))

            }
        }
        if (clientData.status === 'Start') {
            yourNick.style.display = 'block'
            oppNick.style.display = 'block'
            gamePage.style.gap = '200px'
            gamePage.style.textAlign = 'left'
            const tetris = new Tetris({
                elem: document.getElementById('tetris'),
                width: 10,
                height: 20
            });

        }
        if (clientData.status === 'gameField') {
            const opponentField = clientData.field
            drawGameField(opponentField, gameOpp)
        }
        if (clientData.status === 'gameOver') {
            console.log()
        }
        if (clientData.status === 'Disconnected') {
            if (confirm(`Пользователь ${clientData.name} отключился, продолжить игру?`)) {

            } else {
                getRecordScore()
                location.reload()
            }
        }
    };

    socket.onclose = function(event) {

        console.log('Соединение прервано!');
        location.reload()

    };


})

/**
 * @param options Parameters
 * @param options.elem DOM element for component
 * @param options.width Width of game field
 * @param options.height Height of game field
 */
function Tetris(options) {
    var elem = options.elem;
    var width = (+options.width < 10) ? 10 : ~~(+options.width);
    var height = (+options.height < 20) ? 21 : ~~(+options.height + 1);

    var controlTimeoutHandle;
    var fallingTimeoutHandle;

    var predictionField;
    var scoreField;
    var gameField;

    var tetraminoForms = [
        [
            ['i', 'i', 'i', 'i']
        ],

        [
            ['j', '.', '.'],
            ['j', 'j', 'j']
        ],

        [
            ['.', '.', 'l'],
            ['l', 'l', 'l']
        ],

        [
            ['o', 'o'],
            ['o', 'o']
        ],

        [
            ['.', 's', 's'],
            ['s', 's', '.']
        ],

        [
            ['.', 't', '.'],
            ['t', 't', 't']
        ],

        [
            ['z', 'z', '.'],
            ['.', 'z', 'z']
        ]
    ];

    var fieldArray = [];

    var currentTetramino;
    var nextTetramino;

    var coordsToMove = [0, 0];

    var fallSpeed = 1000;

    function generateComponent() {

        function generateUI() {
            var divUi = document.createElement('div');

            predictionField = document.createElement('table');

            for (var i = 0; i < 4; i++) {
                var tr = document.createElement('tr');
                for (var j = 0; j < 4; j++) {
                    var td = document.createElement('td');
                    tr.appendChild(td);
                }
                predictionField.appendChild(tr);
            }

            scoreField = document.createElement('div');
            scoreField.classList.add('score-field');
            scoreField.innerHTML = 0;

            divUi.appendChild(predictionField);
            divUi.appendChild(scoreField);

            divUi.classList.add('ui');

            elem.appendChild(divUi);
        }

        function generateGlassUI() {
            var divGameField = document.createElement('div');

            gameField = document.createElement('table');
            gameField.classList.add('glass')

            for (var i = 0; i < height; i++) {
                var tr = document.createElement('tr');
                for (var j = 0; j < width; j++) {
                    var td = document.createElement('td');
                    tr.appendChild(td);
                }
                gameField.appendChild(tr);
            }

            divGameField.appendChild(gameField);

            divGameField.classList.add('game');

            elem.appendChild(divGameField);
        }

        function generateFieldArray() {
            for (var i = 0; i < height; i++) {
                fieldArray.push([]);
                for (var j = 0; j < width; j++) {
                    fieldArray[i].push('.');
                }
            }
        }

        generateUI();
        generateGlassUI();
        generateFieldArray();
    }

    // ------------- Tetramino Class ------------------

    function Tetramino(type) {
        this.form = tetraminoForms[type].slice(0);
        this.coords = [~~(width / 2) - ~~(tetraminoForms[type][0].length / 2), 0];
        this.prevCoords;
    }

    Tetramino.prototype.rotate = function() {
        var temp = new Array(this.form[0].length);

        for (var i = 0; i < temp.length; i++) {
            temp[i] = new Array(this.form.length);
            for (var j = 0; j < temp[i].length; j++) {
                temp[i][j] = this.form[temp[i].length - j - 1][i];
            }
        }

        for (var i = 0; i < temp.length; i++) {
            for (var j = 0; j < temp[i].length; j++) {
                if (fieldArray[this.coords[1] + i] !== undefined &&
                    fieldArray[this.coords[1] + i][this.coords[0] + j] !== undefined &&
                    fieldArray[this.coords[1] + i][this.coords[0] + j] === '.') {

                    continue;
                } else {
                    return;
                }
            }
        }

        this.form = temp;
    };

    Tetramino.prototype.control = function(coords) {
        if (coords[0] === 0 && coords[1] === -1) {
            this.rotate();
            return;
        }

        if (this.coords[0] + coords[0] >= 0 &&
            this.coords[0] + coords[0] + this.form[0].length <= fieldArray[0].length) {

            if (checkSideCoords(this.coords[0] + coords[0], coords[0])) {
                this.coords[0] += coords[0];
            }
        }

        if (this.coords[1] + coords[1] >= 0 &&
            this.coords[1] + coords[1] + this.form.length <= fieldArray.length) {
            this.coords[1] += coords[1];
        }
    };

    // ----------- Tetramino Class End ---------------

    function drawField() {
        for (var i = 0; i < fieldArray.length; i++) {
            for (var j = 0; j < fieldArray[i].length; j++) {
                gameField.rows[i].cells[j].className = '';
                gameField.rows[i].cells[j].classList.add(fieldArray[i][j]);
            }
        }
        const data = {
            status: 'gameField',
            field: fieldArray
        }
        socket.send(JSON.stringify(data))
        const stat = {
            status: 'Stat',
            userInfo: user
        }
        socket.send(JSON.stringify(stat))
    }

    function drawNextTetramino() {
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                predictionField.rows[i].cells[j].className = '';
            }
        }

        for (var i = 0; i < nextTetramino.form.length; i++) {
            for (var j = 0; j < nextTetramino.form[i].length; j++) {
                predictionField.rows[i].cells[j].classList.add(nextTetramino.form[i][j]);
            }
        }
    }

    function controlTetramino(event) {
        var code = event.keyCode;

        if (code === 37) coordsToMove = [-1, 0];
        if (code === 38) coordsToMove = [0, -1];
        if (code === 39) coordsToMove = [1, 0];
        if (code === 40) coordsToMove = [0, 1];
    }

    function runTetris() {
        currentTetramino = new Tetramino(Math.floor(Math.random() * (6 + 1)));
        nextTetramino = new Tetramino(Math.floor(Math.random() * (6 + 1)));

        drawNextTetramino();

        moveTetramino();
        fallTetramino();
    }

    function moveTetramino() {
        if (!gameIsDone) {
            controlTimeoutHandle = setTimeout(function() {

                if (currentTetramino.prevCoords) {
                    for (var i = 0; i < currentTetramino.form.length; i++) {
                        for (var j = 0; j < currentTetramino.form[i].length; j++) {
                            if (currentTetramino.form[i][j] == '.') continue;
                            fieldArray[i + currentTetramino.prevCoords[1]][j + currentTetramino.prevCoords[0]] = '.';
                        }
                    }
                }

                currentTetramino.control(coordsToMove);

                for (var i = 0; i < currentTetramino.form.length; i++) {
                    for (var j = 0; j < currentTetramino.form[i].length; j++) {
                        if (currentTetramino.form[i][j] == '.') continue;
                        fieldArray[i + currentTetramino.coords[1]][j + currentTetramino.coords[0]] = currentTetramino.form[i][j];
                    }
                }

                currentTetramino.prevCoords = currentTetramino.coords.slice(0);
                coordsToMove = [0, 0];

                drawField();
                checkBlocksUnderTetramino();

                moveTetramino();
            }, 0);
        }
    }

    function fallTetramino() {
        fallingTimeoutHandle = setTimeout(function() {

            coordsToMove = [0, 1];

            fallTetramino();
        }, fallSpeed);
    }

    function checkBlocksUnderTetramino() {
        if (currentTetramino.coords[1] + currentTetramino.form.length === fieldArray.length) {
            changeTetramino();
            return;
        }

        for (var i = currentTetramino.form.length - 1; i >= 0; i--) {
            for (var j = currentTetramino.form[i].length - 1; j >= 0; j--) {

                if (currentTetramino.form[i][j] === '.') continue;

                if (fieldArray[currentTetramino.coords[1] + i + 1][currentTetramino.coords[0] + j] !== '.' &&
                    fieldArray[currentTetramino.coords[1] + i][currentTetramino.coords[0] + j] !== '.' &&
                    (currentTetramino.form[i + 1] === undefined || currentTetramino.form[i + 1][j] === '.')) {
                    changeTetramino();
                    return;
                }
            }
        }
    }

    function checkSideCoords(coords, side) {
        if (coords === 0 && coords === fieldArray[0].length) {
            return false;
        }

        var side = (side === -1) ? -1 : currentTetramino.form[0].length;

        for (var i = 0; i < currentTetramino.form.length; i++) {
            if (fieldArray[currentTetramino.coords[1] + i][currentTetramino.coords[0] + side] !== '.' &&
                currentTetramino.form[i][(side === -1) ? 0 : currentTetramino.form[0].length - 1] !== '.') {
                return false;
            }
        }

        return true;
    }

    function changeTetramino() {
        checkAndRemoveFilledRow();

        isGameOver();

        currentTetramino = nextTetramino;
        nextTetramino = new Tetramino(Math.floor(Math.random() * (6 + 1)));
        drawNextTetramino();
        scoreField.innerHTML++;
    }

    function checkAndRemoveFilledRow() {
        for (var i = 0; i < fieldArray.length; i++) {
            var toClean = true;
            for (var j = 0; j < fieldArray[i].length; j++) {
                if (fieldArray[i][j] === '.') {
                    toClean = false;
                    break;
                }
            }
            if (toClean) {
                fieldArray.splice(i, 1);
                fieldArray.unshift([]);

                for (var j = 0; j < width; j++) {
                    fieldArray[0].push('.');
                }

                scoreField.innerHTML = +scoreField.innerHTML + width;
                fallSpeed = (fallSpeed > 300) ? fallSpeed - 50 : fallSpeed;
            }
        }
    }

    function isGameOver() {
        if (currentTetramino.coords[1] <= 1) {
            gameIsDone = true
            canselGame()
            alert('Вы проиграли!')
            getRecordScore()
            location.reload()
                // }
        }
    }

    function resetGame() {
        for (var i = 0; i < fieldArray.length; i++) {
            for (var j = 0; j < fieldArray[i].length; j++) {
                fieldArray[i][j] = '.';
            }
        }

        scoreField.innerHTML = 0;
        fallSpeed = 1000;
    }

    generateComponent();
    drawField();
    document.body.addEventListener('keydown', controlTetramino, false);
    runTetris();

}

function drawGameField(gameFieldOpp, parentElement) {
    // Создаем элемент таблицы

    const table = document.createElement("table");
    // Создаем ячейки и заполняем их значениями из игрового поля
    for (let i = 0; i < gameFieldOpp.length; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < gameFieldOpp[i].length; j++) {
            const cell = document.createElement("td");
            if (gameFieldOpp[i][j] === '.') {
                cell.className = 'cell'
            } else {
                cell.className = `${gameFieldOpp[i][j]}`;

            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    // Очищаем родительский элемент и добавляем в него таблицу
    parentElement.innerHTML = "";
    parentElement.appendChild(table);
}


setInterval(() => {
    if (true) {
        // const currentPage = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
        // const buffer = currentPage.data.buffer
        // socket.send(buffer)
        // console.log(playfield)
        // console.log(JSON.stringify(context.getImageData(0, 0, context.canvas.width, context.canvas.height)))

    }
}, 100)

nickBtn.addEventListener('click', () => {
    localStorage.setItem('tetrisName', nicknameInput.value)
})