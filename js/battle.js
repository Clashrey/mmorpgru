/**
 * Боевая система для ММО-РПГ
 */
class BattleSystem {
    constructor() {
        this.currentBattle = null;
        this.mobNames = [
            'Злой Гоблин', 'Дикий Волк', 'Бандит', 'Скелет-воин', 'Орк-берсерк',
            'Зомби', 'Паук-охотник', 'Темный маг', 'Разбойник', 'Тролль'
        ];
        this.initializeEventListeners();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Кнопка арены в основном интерфейсе
            const arenaBtn = document.querySelector('.action-btn');
            if (arenaBtn && arenaBtn.textContent.includes('Арена')) {
                arenaBtn.addEventListener('click', () => this.showArena());
            }
            
            // Кнопки в арене
            const findPlayerBtn = document.getElementById('find-player-btn');
            const findMobBtn = document.getElementById('find-mob-btn');
            const startFightBtn = document.getElementById('start-fight-btn');
            const continueBtn = document.getElementById('continue-btn');
            const arenaBackBtn = document.getElementById('arena-back-btn');
            
            if (findPlayerBtn) {
                findPlayerBtn.addEventListener('click', () => this.findOpponent('player'));
            }
            
            if (findMobBtn) {
                findMobBtn.addEventListener('click', () => this.findOpponent('mob'));
            }
            
            if (startFightBtn) {
                startFightBtn.addEventListener('click', () => this.startBattle());
            }
            
            if (continueBtn) {
                continueBtn.addEventListener('click', () => this.returnToArena());
            }
            
            if (arenaBackBtn) {
                arenaBackBtn.addEventListener('click', () => this.backToGame());
            }
        });
    }
    
    /**
     * Показать арену
     */
    showArena() {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        window.gameApp.showScreen('arena-screen');
        this.updateArenaDisplay(currentUser);
    }
    
    /**
     * Обновить отображение арены
     */
    updateArenaDisplay(user) {
        const battleStats = this.calculateBattleStats(user);
        
        // Обновляем информацию об игроке
        document.getElementById('arena-player-name').textContent = user.nickname;
        document.getElementById('arena-player-hp').textContent = battleStats.hp;
        document.getElementById('arena-player-attack').textContent = battleStats.attack;
        document.getElementById('arena-player-defense').textContent = battleStats.defense;
        
        const factionName = user.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('arena-player-faction').textContent = factionName;
        
        // Скрываем результаты предыдущих боев
        document.getElementById('battle-result').style.display = 'none';
    }
    
    /**
     * Рассчитать боевые характеристики
     */
    calculateBattleStats(user) {
        const stats = user.stats || {};
        
        return {
            hp: 50 + (stats.end || 1) * 10,
            attack: 10 + (stats.str || 1) * 3,
            defense: (stats.end || 1) * 2,
            dodgeChance: ((stats.dex || 1) * 1.5 + (stats.int || 1) * 2 + (stats.lck || 1) * 1),
            doubleHitChance: ((stats.dex || 1) * 2 + (stats.lck || 1) * 1.5),
            speed: stats.dex || 1
        };
    }
    
    /**
     * Найти противника
     */
    findOpponent(type) {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        let opponent;
        
        if (type === 'player') {
            opponent = this.findPlayerOpponent(currentUser);
        }
        
        if (!opponent || type === 'mob') {
            opponent = this.generateMob(currentUser);
        }
        
        this.showBattleSetup(currentUser, opponent);
    }
    
    /**
     * Найти игрока-противника
     */
    findPlayerOpponent(currentUser) {
        const users = window.authSystem.getUsers();
        const currentLevel = currentUser.level || 1;
        
        // Ищем игроков подходящего уровня (±2)
        const suitableOpponents = users.filter(user => {
            const userLevel = user.level || 1;
            return user.id !== currentUser.id && 
                   Math.abs(userLevel - currentLevel) <= 2;
        });
        
        if (suitableOpponents.length === 0) {
            return null;
        }
        
        // Выбираем случайного противника
        const randomIndex = Math.floor(Math.random() * suitableOpponents.length);
        return suitableOpponents[randomIndex];
    }
    
    /**
     * Сгенерировать моба
     */
    generateMob(currentUser) {
        const playerStats = this.calculateBattleStats(currentUser);
        const randomName = this.mobNames[Math.floor(Math.random() * this.mobNames.length)];
        
        // Генерируем моба слабее игрока для 60%+ шанса победы
        const mobLevel = Math.max(1, (currentUser.level || 1) - Math.floor(Math.random() * 2));
        
        const mob = {
            id: 'mob_' + Date.now(),
            nickname: randomName,
            faction: Math.random() > 0.5 ? 'workers' : 'creatives',
            level: mobLevel,
            isBot: true,
            gold: 50 + Math.floor(Math.random() * 151), // 50-200 золота
            stats: {
                str: Math.max(1, Math.floor(playerStats.attack / 3 * (0.7 + Math.random() * 0.2))),
                end: Math.max(1, Math.floor(playerStats.hp / 10 * (0.8 + Math.random() * 0.2))),
                dex: Math.max(1, Math.floor((currentUser.stats?.dex || 1) * (0.6 + Math.random() * 0.3))),
                int: Math.max(1, Math.floor((currentUser.stats?.int || 1) * (0.6 + Math.random() * 0.3))),
                lck: Math.max(1, Math.floor((currentUser.stats?.lck || 1) * (0.6 + Math.random() * 0.3))),
                cha: 1
            }
        };
        
        return mob;
    }
    
    /**
     * Показать экран подготовки к бою
     */
    showBattleSetup(player, opponent) {
        const playerStats = this.calculateBattleStats(player);
        const opponentStats = this.calculateBattleStats(opponent);
        
        // Заполняем данные игрока
        document.getElementById('fighter1-name').textContent = player.nickname;
        document.getElementById('fighter1-hp').textContent = playerStats.hp;
        document.getElementById('fighter1-attack').textContent = playerStats.attack;
        document.getElementById('fighter1-defense').textContent = playerStats.defense;
        
        const playerFaction = player.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('fighter1-faction').textContent = playerFaction;
        
        // Заполняем данные противника
        document.getElementById('fighter2-name').textContent = opponent.nickname;
        document.getElementById('fighter2-hp').textContent = opponentStats.hp;
        document.getElementById('fighter2-attack').textContent = opponentStats.attack;
        document.getElementById('fighter2-defense').textContent = opponentStats.defense;
        
        const opponentFaction = opponent.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('fighter2-faction').textContent = opponentFaction;
        
        // Сохраняем данные боя
        this.currentBattle = {
            player: { ...player, battleStats: playerStats },
            opponent: { ...opponent, battleStats: opponentStats },
            log: [],
            winner: null,
            rewards: null
        };
        
        // Показываем секцию результата
        document.getElementById('battle-result').style.display = 'block';
        document.getElementById('battle-log').style.display = 'none';
        document.getElementById('battle-outcome').style.display = 'none';
    }
    
    /**
     * Начать бой
     */
    startBattle() {
        if (!this.currentBattle) return;
        
        // Скрываем кнопку начала боя
        document.getElementById('start-fight-btn').style.display = 'none';
        
        // Показываем лог боя
        document.getElementById('battle-log').style.display = 'block';
        
        // Симулируем бой
        this.simulateBattle();
    }
    
    /**
     * Симулировать бой
     */
    simulateBattle() {
        const battle = this.currentBattle;
        const player = { ...battle.player.battleStats, name: battle.player.nickname };
        const opponent = { ...battle.opponent.battleStats, name: battle.opponent.nickname };
        
        let playerHp = player.hp;
        let opponentHp = opponent.hp;
        let turn = 0;
        
        battle.log = [];
        
        // Определяем порядок ходов по скорости
        const playerGoesFirst = player.speed >= opponent.speed;
        
        battle.log.push({
            type: 'system',
            message: `Бой начинается! ${playerGoesFirst ? player.name : opponent.name} атакует первым.`
        });
        
        // Основной цикл боя
        while (playerHp > 0 && opponentHp > 0 && turn < 20) { // Максимум 20 ходов
            turn++;
            
            if ((playerGoesFirst && turn % 2 === 1) || (!playerGoesFirst && turn % 2 === 0)) {
                // Ход игрока
                const result = this.performAttack(player, opponent);
                opponentHp -= result.damage;
                battle.log.push({
                    type: 'player-action',
                    message: result.message
                });
                
                if (result.doubleHit) {
                    const secondResult = this.performAttack(player, opponent);
                    opponentHp -= secondResult.damage;
                    battle.log.push({
                        type: 'player-action',
                        message: `Двойной удар! ${secondResult.message}`
                    });
                }
            } else {
                // Ход противника
                const result = this.performAttack(opponent, player);
                playerHp -= result.damage;
                battle.log.push({
                    type: 'opponent-action',
                    message: result.message.replace(opponent.name, battle.opponent.nickname)
                });
                
                if (result.doubleHit) {
                    const secondResult = this.performAttack(opponent, player);
                    playerHp -= secondResult.damage;
                    battle.log.push({
                        type: 'opponent-action',
                        message: `Двойной удар! ${secondResult.message.replace(opponent.name, battle.opponent.nickname)}`
                    });
                }
            }
            
            // Проверяем окончание боя
            if (playerHp <= 0 || opponentHp <= 0) {
                break;
            }
        }
        
        // Определяем победителя
        if (playerHp > 0) {
            battle.winner = 'player';
            battle.log.push({
                type: 'system',
                message: `🏆 ${battle.player.nickname} одерживает победу!`
            });
        } else {
            battle.winner = 'opponent';
            battle.log.push({
                type: 'system',
                message: `💀 ${battle.opponent.nickname} побеждает!`
            });
        }
        
        // Рассчитываем награды
        this.calculateRewards();
        
        // Показываем лог и результат
        this.displayBattleLog();
        setTimeout(() => {
            this.showBattleOutcome();
        }, 2000);
    }
    
    /**
     * Выполнить атаку
     */
    performAttack(attacker, defender) {
        // Проверяем уворот
        const dodgeRoll = Math.random() * 100;
        if (dodgeRoll < defender.dodgeChance) {
            return {
                damage: 0,
                dodged: true,
                doubleHit: false,
                message: `${attacker.name} атакует, но ${defender.name} увернулся!`
            };
        }
        
        // Рассчитываем урон
        let damage = Math.max(1, attacker.attack - defender.defense);
        
        // Проверяем двойной удар
        const doubleHitRoll = Math.random() * 100;
        const doubleHit = doubleHitRoll < attacker.doubleHitChance;
        
        return {
            damage: damage,
            dodged: false,
            doubleHit: doubleHit,
            message: `${attacker.name} наносит ${damage} урона!`
        };
    }
    
    /**
     * Рассчитать награды
     */
    calculateRewards() {
        const battle = this.currentBattle;
        
        if (battle.winner === 'player') {
            // Опыт за победу
            let exp = 8; // Базовый опыт
            
            if (!battle.opponent.isBot) {
                const levelDiff = (battle.opponent.level || 1) - (battle.player.level || 1);
                if (levelDiff >= 2) exp = 20;
                else if (levelDiff >= 1) exp = 15;
                else if (levelDiff >= 0) exp = 10;
                else exp = 5;
            }
            
            // Золото за победу
            let gold = 0;
            if (battle.opponent.isBot) {
                gold = battle.opponent.gold; // Все золото моба
            } else {
                gold = Math.floor((battle.opponent.gold || 0) * 0.15); // 15% от золота игрока
            }
            
            battle.rewards = { exp, gold };
        } else {
            // При поражении игрок теряет золото
            const playerGold = battle.player.gold || 0;
            const lostGold = Math.floor(playerGold * 0.1); // Теряем 10%
            
            battle.rewards = { exp: 0, gold: -lostGold };
        }
    }
    
    /**
     * Отобразить лог боя
     */
    displayBattleLog() {
        const logEntries = document.getElementById('log-entries');
        logEntries.innerHTML = '';
        
        this.currentBattle.log.forEach(entry => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${entry.type}`;
            logElement.textContent = entry.message;
            logEntries.appendChild(logElement);
        });
        
        // Прокручиваем вниз
        logEntries.scrollTop = logEntries.scrollHeight;
    }
    
    /**
     * Показать результат боя
     */
    showBattleOutcome() {
        const battle = this.currentBattle;
        const outcomeDiv = document.getElementById('battle-outcome');
        
        if (battle.winner === 'player') {
            outcomeDiv.className = 'battle-outcome';
            document.getElementById('outcome-title').textContent = '🏆 ПОБЕДА!';
            document.getElementById('outcome-description').textContent = 'Вы одержали убедительную победу!';
        } else {
            outcomeDiv.className = 'battle-outcome defeat';
            document.getElementById('outcome-title').textContent = '💀 ПОРАЖЕНИЕ';
            document.getElementById('outcome-description').textContent = 'Вы потерпели поражение...';
        }
        
        // Показываем награды
        if (battle.rewards.exp > 0) {
            document.getElementById('reward-exp').textContent = battle.rewards.exp;
        } else {
            document.querySelector('.reward-item').style.display = 'none';
        }
        
        document.getElementById('reward-gold').textContent = battle.rewards.gold;
        
        // Применяем награды к игроку
        this.applyRewards();
        
        outcomeDiv.style.display = 'block';
    }
    
    /**
     * Применить награды
     */
    applyRewards() {
        const currentUser = window.authSystem.getCurrentUser();
        const battle = this.currentBattle;
        
        if (!currentUser || !battle.rewards) return;
        
        // Применяем опыт
        if (battle.rewards.exp > 0) {
            currentUser.experience = (currentUser.experience || 0) + battle.rewards.exp;
            
            // Проверяем повышение уровня
            const requiredExp = (currentUser.level || 1) * 100;
            if (currentUser.experience >= requiredExp) {
                currentUser.level = (currentUser.level || 1) + 1;
                currentUser.experience = 0;
                
                // Повышаем все статы на 1
                Object.keys(currentUser.stats).forEach(stat => {
                    currentUser.stats[stat] += 1;
                });
                
                // Даем 50 золота за повышение уровня
                currentUser.gold = (currentUser.gold || 0) + 50;
                
                // Пересчитываем здоровье
                currentUser.health = 50 + currentUser.stats.end * 10;
            }
        }
        
        // Применяем золото
        currentUser.gold = Math.max(0, (currentUser.gold || 0) + battle.rewards.gold);
        
        // Сохраняем изменения
        const users = window.authSystem.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            window.authSystem.saveUsers(users);
            window.authSystem.setCurrentUser(currentUser);
        }
        
        console.log('Награды применены:', battle.rewards);
    }
    
    /**
     * Вернуться в арену
     */
    returnToArena() {
        this.currentBattle = null;
        
        // Обновляем отображение игрока с новыми характеристиками
        const currentUser = window.authSystem.getCurrentUser();
        this.updateArenaDisplay(currentUser);
        
        // Обновляем основной интерфейс
        window.authSystem.displayPlayerInfo(currentUser);
    }
    
    /**
     * Вернуться в игру
     */
    backToGame() {
        window.gameApp.showScreen('game-screen');
    }
}

// Создаем глобальный экземпляр боевой системы
if (!window.battleSystem) {
    window.battleSystem = new BattleSystem();
}

// Функция для отладки боя
window.debugBattle = () => {
    const currentUser = window.authSystem.getCurrentUser();
    if (currentUser) {
        const stats = window.battleSystem.calculateBattleStats(currentUser);
        console.log('=== БОЕВЫЕ ХАРАКТЕРИСТИКИ ===');
        console.log('HP:', stats.hp);
        console.log('Атака:', stats.attack);
        console.log('Защита:', stats.defense);
        console.log('Шанс уворота:', stats.dodgeChance + '%');
        console.log('Шанс двойного удара:', stats.doubleHitChance + '%');
        console.log('Скорость:', stats.speed);
    }
};
