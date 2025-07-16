// api/players.js - Vercel Serverless Function для работы с игроками
export default async function handler(req, res) {
    // Включаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Временное хранилище (в продакшене использовать Redis/PostgreSQL)
    // Для demo используем глобальную переменную
    if (!global.gameData) {
        global.gameData = {
            players: new Map(),
            lastActivity: new Map(),
            worldState: {
                mobs: generateInitialMobs(),
                lastMobUpdate: Date.now()
            }
        };
    }

    try {
        switch (req.method) {
            case 'GET':
                return handleGetPlayers(req, res);
            case 'POST':
                return handlePlayerAction(req, res);
            default:
                res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Получить список активных игроков
function handleGetPlayers(req, res) {
    const now = Date.now();
    const activeThreshold = 30 * 1000; // 30 секунд

    // Очищаем неактивных игроков
    for (let [playerId, lastActive] of global.gameData.lastActivity) {
        if (now - lastActive > activeThreshold) {
            global.gameData.players.delete(playerId);
            global.gameData.lastActivity.delete(playerId);
        }
    }

    // Обновляем мобов
    updateMobs();

    const activePlayers = Array.from(global.gameData.players.values());
    const worldState = global.gameData.worldState;

    res.status(200).json({
        players: activePlayers,
        mobs: Array.from(worldState.mobs.values()),
        timestamp: now,
        totalPlayers: activePlayers.length
    });
}

// Обработка действий игрока
function handlePlayerAction(req, res) {
    const { action, playerData } = req.body;
    const playerId = playerData.id || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    global.gameData.lastActivity.set(playerId, Date.now());

    switch (action) {
        case 'join':
            return handlePlayerJoin(playerId, playerData, res);
        case 'move':
            return handlePlayerMove(playerId, playerData, res);
        case 'attack_mob':
            return handleAttackMob(playerId, playerData, res);
        case 'chat':
            return handleChatMessage(playerId, playerData, res);
        default:
            res.status(400).json({ error: 'Unknown action' });
    }
}

// Игрок присоединяется
function handlePlayerJoin(playerId, playerData, res) {
    const player = {
        id: playerId,
        nickname: playerData.nickname,
        faction: playerData.faction,
        level: playerData.level || 1,
        x: 7, // Стартовая позиция в центре карты 15x15
        y: 7,
        lastSeen: Date.now(),
        stats: playerData.stats || {}
    };

    global.gameData.players.set(playerId, player);

    res.status(200).json({
        success: true,
        playerId: playerId,
        worldState: {
            players: Array.from(global.gameData.players.values()),
            mobs: Array.from(global.gameData.worldState.mobs.values())
        }
    });
}

// Движение игрока
function handlePlayerMove(playerId, playerData, res) {
    const player = global.gameData.players.get(playerId);
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }

    const { direction } = playerData;
    let newX = player.x;
    let newY = player.y;

    switch (direction) {
        case 'up': newY = Math.max(0, player.y - 1); break;
        case 'down': newY = Math.min(14, player.y + 1); break;
        case 'left': newX = Math.max(0, player.x - 1); break;
        case 'right': newX = Math.min(14, player.x + 1); break;
    }

    player.x = newX;
    player.y = newY;
    player.lastSeen = Date.now();

    // Проверяем столкновение с мобами
    const mobsAtPosition = Array.from(global.gameData.worldState.mobs.values())
        .filter(mob => mob.x === newX && mob.y === newY && mob.hp > 0);

    res.status(200).json({
        success: true,
        newPosition: { x: newX, y: newY },
        mobsEncountered: mobsAtPosition
    });
}

// Атака моба
function handleAttackMob(playerId, playerData, res) {
    const player = global.gameData.players.get(playerId);
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }

    const { mobId } = playerData;
    const mob = global.gameData.worldState.mobs.get(mobId);
    
    if (!mob || mob.hp <= 0) {
        return res.status(404).json({ error: 'Mob not found or already dead' });
    }

    // Проверяем дистанцию
    const distance = Math.abs(player.x - mob.x) + Math.abs(player.y - mob.y);
    if (distance > 1) {
        return res.status(400).json({ error: 'Too far from mob' });
    }

    // Симулируем бой
    const battleResult = simulateBattle(player, mob);
    
    res.status(200).json({
        success: true,
        battleResult: battleResult
    });
}

// Чат сообщение
function handleChatMessage(playerId, playerData, res) {
    const player = global.gameData.players.get(playerId);
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }

    const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        playerId: playerId,
        playerName: player.nickname,
        faction: player.faction,
        message: playerData.message.trim(),
        timestamp: Date.now()
    };

    // В реальной версии здесь бы сохранялось в БД и рассылалось через WebSocket
    // Пока просто возвращаем подтверждение
    res.status(200).json({
        success: true,
        message: message
    });
}

// Генерация начальных мобов
function generateInitialMobs() {
    const mobs = new Map();
    const mobTypes = [
        { name: 'Гоблин-рабочий', hp: 40, attack: 12, defense: 3, gold: 25 },
        { name: 'Креативный Пикси', hp: 30, attack: 15, defense: 2, gold: 30 },
        { name: 'Злой Менеджер', hp: 60, attack: 18, defense: 5, gold: 50 },
        { name: 'Дикий Фрилансер', hp: 45, attack: 14, defense: 3, gold: 35 }
    ];

    for (let i = 0; i < 20; i++) {
        const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        const mob = {
            id: `mob_${i}`,
            ...mobType,
            x: Math.floor(Math.random() * 15),
            y: Math.floor(Math.random() * 15),
            maxHp: mobType.hp,
            lastUpdate: Date.now()
        };
        mobs.set(mob.id, mob);
    }

    return mobs;
}

// Обновление мобов (респавн, регенерация)
function updateMobs() {
    const now = Date.now();
    const timeSinceUpdate = now - global.gameData.worldState.lastMobUpdate;

    // Обновляем каждые 30 секунд
    if (timeSinceUpdate > 30000) {
        for (let [mobId, mob] of global.gameData.worldState.mobs) {
            // Респавн мертвых мобов через 2 минуты
            if (mob.hp <= 0 && (now - mob.deathTime) > 120000) {
                mob.hp = mob.maxHp;
                mob.x = Math.floor(Math.random() * 15);
                mob.y = Math.floor(Math.random() * 15);
                delete mob.deathTime;
            }
        }
        global.gameData.worldState.lastMobUpdate = now;
    }
}

// Симуляция боя
function simulateBattle(player, mob) {
    const playerStats = {
        hp: 50 + (player.stats.end || 1) * 10,
        attack: 10 + (player.stats.str || 1) * 3,
        defense: (player.stats.end || 1) * 2
    };

    let playerHp = playerStats.hp;
    let mobHp = mob.hp;
    const log = [];

    // Простой бой - по 1 удару каждый
    const playerDamage = Math.max(1, playerStats.attack - mob.defense);
    const mobDamage = Math.max(1, mob.attack - playerStats.defense);

    mobHp -= playerDamage;
    log.push(`Вы нанесли ${playerDamage} урона мобу ${mob.name}`);

    if (mobHp <= 0) {
        // Игрок победил
        mob.hp = 0;
        mob.deathTime = Date.now();
        
        const rewards = {
            exp: 10 + Math.floor(Math.random() * 10),
            gold: mob.gold
        };

        log.push(`Победа! Получено: ${rewards.exp} опыта, ${rewards.gold} золота`);

        return {
            result: 'victory',
            log: log,
            rewards: rewards
        };
    } else {
        playerHp -= mobDamage;
        log.push(`${mob.name} нанес вам ${mobDamage} урона`);

        if (playerHp <= 0) {
            // Игрок проиграл
            log.push('Поражение!');
            return {
                result: 'defeat',
                log: log,
                rewards: { exp: 0, gold: 0 }
            };
        } else {
            // Ничья или бой продолжается
            mob.hp = mobHp;
            log.push('Бой продолжается...');
            return {
                result: 'ongoing',
                log: log,
                mobHp: mobHp,
                playerHp: playerHp
            };
        }
    }
}
