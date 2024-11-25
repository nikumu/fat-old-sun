// Obtém os elementos do DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Define as dimensões do jogo
const GAME_WIDTH = 500;
const GAME_HEIGHT = 500;

// Inicializa o jogador
let player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    radius: 10,
    color: '#FFD700',
    score: 0
};

// Array para armazenar os objetos celestes
let celestialObjects = [];

// Função para desenhar o jogador
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
}

// Função para desenhar os objetos celestes
function drawCelestialObject(obj) {
    if (obj.type === 'blackHole') {
        drawDiamond(obj);
    } else if (obj.type === 'planet' && obj.hasRing) {
        drawPlanetWithRing(obj);
    } else {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        ctx.fillStyle = obj.color;
        ctx.fill();
        ctx.closePath();
    }
}

// Função para desenhar o buraco negro em forma de losango
function drawDiamond(obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-obj.radius, -obj.radius, obj.radius * 2, obj.radius * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Função para desenhar um planeta com anel
function drawPlanetWithRing(obj) {
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y, obj.radius * 1.5, obj.radius * 0.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#A52A2A';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Função para criar um novo objeto celeste
function createCelestialObject() {
    const types = ['star', 'planet', 'blackHole', 'sun'];
    const type = types[Math.floor(Math.random() * types.length)];
    let radius, color, hasRing;

    switch (type) {
        case 'star':
            radius = 3;
            color = '#FFFFFF';
            break;
        case 'planet':
            radius = Math.random() * 10 + 5;
            color = Math.random() < 0.7 ? '#8B4513' : '#FFD700';
            hasRing = Math.random() < 0.5;
            break;
        case 'blackHole':
            radius = 15;
            color = '#FF0000';
            break;
        case 'sun':
            radius = Math.random() * 15 + 5;
            color = Math.random() < 0.5 ? '#FFD700' : '#FFA500';
            break;
    }

    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
        case 0: // Topo
            x = Math.random() * GAME_WIDTH;
            y = -radius;
            break;
        case 1: // Direita
            x = GAME_WIDTH + radius;
            y = Math.random() * GAME_HEIGHT;
            break;
        case 2: // Baixo
            x = Math.random() * GAME_WIDTH;
            y = GAME_HEIGHT + radius;
            break;
        case 3: // Esquerda
            x = -radius;
            y = Math.random() * GAME_HEIGHT;
            break;
    }

    return {
        x: x,
        y: y,
        radius: radius,
        color: color,
        type: type,
        hasRing: hasRing,
        speed: Math.random() * 2 + 1,
        angle: Math.atan2(GAME_HEIGHT / 2 - y, GAME_WIDTH / 2 - x)
    };
}

// Função para atualizar os objetos celestes
function updateCelestialObjects() {
    for (let i = celestialObjects.length - 1; i >= 0; i--) {
        let obj = celestialObjects[i];
        obj.x += Math.cos(obj.angle) * obj.speed;
        obj.y += Math.sin(obj.angle) * obj.speed;

        if (obj.x < -obj.radius || obj.x > GAME_WIDTH + obj.radius ||
            obj.y < -obj.radius || obj.y > GAME_HEIGHT + obj.radius) {
            celestialObjects.splice(i, 1);
        } else {
            drawCelestialObject(obj);
            checkCollision(obj);
            applyRules(obj);
        }
    }

    if (Math.random() < 0.02) {
        celestialObjects.push(createCelestialObject());
    }
}

// Função para verificar colisões
function checkCollision(obj) {
    const dx = player.x - obj.x;
    const dy = player.y - obj.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.radius + obj.radius) {
        switch (obj.type) {
            case 'star':
                player.radius += 1;
                player.score += 10;
                break;
            case 'planet':
                player.radius += 2;
                player.score += 20;
                break;
            case 'blackHole':
                gameOver();
                break;
            case 'sun':
                if (obj.radius >= player.radius) {
                    gameOver();
                } else {
                    player.radius += obj.radius / 2;
                    player.score += Math.floor(obj.radius);
                }
                break;
        }
        celestialObjects = celestialObjects.filter(o => o !== obj);
        updateScore();
    }
}

// Função para aplicar as regras aos outros objetos
function applyRules(obj) {
    for (let other of celestialObjects) {
        if (obj !== other) {
            const dx = obj.x - other.x;
            const dy = obj.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < obj.radius + other.radius) {
                switch (obj.type) {
                    case 'sun':
                        if (other.type === 'sun' && other.radius <= obj.radius / 2) {
                            obj.radius += other.radius / 2;
                            celestialObjects = celestialObjects.filter(o => o !== other);
                        } else if (other.type === 'planet') {
                            celestialObjects = celestialObjects.filter(o => o !== other);
                        } else if (other.type === 'star') {
                            celestialObjects = celestialObjects.filter(o => o !== other);
                            celestialObjects.push(createBlackHole(other.x, other.y));
                        } else if (other.type === 'blackHole') {
                            celestialObjects = celestialObjects.filter(o => o !== obj);
                        }
                        break;
                    case 'planet':
                        celestialObjects = celestialObjects.filter(o => o !== obj);
                        break;
                    case 'star':
                        celestialObjects = celestialObjects.filter(o => o !== obj);
                        celestialObjects.push(createBlackHole(obj.x, obj.y));
                        break;
                    case 'blackHole':
                        obj.radius += other.radius / 2;
                        celestialObjects = celestialObjects.filter(o => o !== other);
                        break;
                }
            }
        }
    }
}

// Função para criar um buraco negro
function createBlackHole(x, y) {
    return {
        x: x,
        y: y,
        radius: 15,
        color: '#FF0000',
        type: 'blackHole',
        speed: 1,
        angle: Math.atan2(GAME_HEIGHT / 2 - y, GAME_WIDTH / 2 - x)
    };
}

// Função para atualizar a pontuação
function updateScore() {
    scoreElement.textContent = player.score;
}

// Função de fim de jogo
function gameOver() {
    alert('Fim de Jogo! Pontuação: ' + player.score);
    player.radius = 10;
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT / 2;
    player.score = 0;
    celestialObjects = [];
    updateScore();
}

// Função principal de atualização do jogo
function update() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawPlayer();
    updateCelestialObjects();
    requestAnimationFrame(update);
}

// Função para ajustar o tamanho do canvas
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const containerWidth = container.clientWidth;
    const scale = containerWidth / GAME_WIDTH;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
}

// Adiciona eventos de mouse e toque para controlar o jogador
canvas.addEventListener('mousemove', movePlayer);
canvas.addEventListener('touchmove', movePlayer);

function movePlayer(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.type === 'mousemove') {
        player.x = (e.clientX - rect.left) * scaleX;
        player.y = (e.clientY - rect.top) * scaleY;
    } else if (e.type === 'touchmove') {
        player.x = (e.touches[0].clientX - rect.left) * scaleX;
        player.y = (e.touches[0].clientY - rect.top) * scaleY;
    }
}

// Inicializa o jogo
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
update();

