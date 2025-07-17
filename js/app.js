/**
 * Главный класс приложения с поддержкой новой системы характеристик
 */
class GameApp {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.currentBattle = null;
        this.mobNames = [
            'Злой Гоблин', 'Дикий Волк', 'Бандит', 'Скелет-воин', 'Орк-берсерк',
            'Зомби', 'Паук-охотник', 'Темный маг', 'Разбойник', 'Тролль'
        ];
        this.initializeEventListeners();
        this.checkAutoLogin();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Кнопки главного меню
            const btnRegister = document.getElementById('btn-register');
            const btnLogin = document.getElementById('btn-login');
            
            if (btnRegister) {
                btnRegister.addEventListener('click', () => this.showScreen('register-screen'));
            }
            
            if (btnLogin) {
                btnLogin.addEventListener('click', () => this.showScreen('login-screen'));
            }
            
            // Кнопки "Назад"
            const btnBack = document.getElementById('btn-back');
            const btnLoginBack = document.getElementById('btn-login-back');
            const btnCharBack = document.getElementById('btn-char-back');
            
            if (btnBack) {
                btnBack.addEventListener('click', () => this.showScreen('loading-screen'));
            }
            
            if (btnLoginBack) {
                btnLoginBack.addEventListener('click', () => this.showScreen('loading-screen'));
            }
            
            if (btnCharBack) {
                btnCharBack.addEventListener('click', () => {
                    window.gameCharacter.resetStats();
                    this.showScreen('register-screen');
                });
            }
            
            // Кнопка создания персонажа
            const btnCreateCharacter = document.getElementById('btn-create-character');
            if (btnCreateCharacter) {
                btnCreateCharacter.addEventListener('click', () => {
                    window.authSystem.completeCharacterCreation();
                });
            }
            
            // Кнопка выхода
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                    window.authSystem.logout();
                });
            }
            
            // Кнопка тренировки (переход в спортзал)
            const btnTrain = document.getElementById('train-btn');
            if (btnTrain) {
                btnTrain.addEventListener('click', () => this.showGym());
            }
            
            // Кнопка арены
            const arenaBtn = document.getElementById('arena-btn');
            if (arenaBtn) {
                arenaBtn.addEventListener('click', () => {
                    console.log('Переходим в арену...');
                    this.showScreen('arena-screen');
                    
                    // Обновляем данные игрока в арене
                    const currentUser = window.authSystem.getCurrentUser();
                    if (currentUser) {
                        setTimeout(() => {
                            this.updateArenaDisplay(currentUser);
                        }, 100);
                    }
                });
            }
            
            // Кнопка возврата из спортзала
            const gymBackBtn = document.getElementById('gym-back-btn');
            if (gymBackBtn) {
                gymBackBtn.addEventListener('click', () => this.showScreen('game-screen'));
            }
            
            // Кнопки тренировок в спортзале
            document.querySelectorAll('.upgrade-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const stat = e.target.dataset.stat;
                    this.trainStat(stat);
                });
            });
        });
    }
    
    /**
     * Показать определенный экран
     */
    showScreen(screenId) {
        // Скрываем все экраны
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показываем нужный экран
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Выполняем специфичные действия для экранов
            this.onScreenShow(screenId);
        }
    }
    
    /**
     * Действия при показе экрана
     */
    onScreenShow(screenId) {
        switch (screenId) {
            case 'character-screen':
                // Обновляем отображение характеристик (если функция существует)
                if (window.gameCharacter && window.gameCharacter.updateStatsDisplay) {
                    window.gameCharacter.updateStatsDisplay();
                }
                break;
                
            case 'gym-screen':
                // Обновляем отображение спортзала
                const currentUser = window.authSystem.getCurrentUser();
                if (currentUser) {
                    this.updateGymDisplay(currentUser);
                }
                break;
                
            case 'arena-screen':
                // Обновляем отображение арены
                const arenaUser = window.authSystem.getCurrentUser();
                if (arenaUser) {
                    this.updateArenaDisplay(arenaUser);
                }
                break;
                
            case 'register-screen':
                this.clearForm('register-form');
                this.initRegisterButton();
                break;
                
            case 'login-screen':
                this.clearForm('login-form');
                break;
                
            case 'loading-screen':
                if (window.tempRegistrationData) {
                    delete window.tempRegistrationData;
                }
                window.gameCharacter.resetStats();
                break;
        }
    }
    
    /**
     * Обновить отображение арены
     */
    updateArenaDisplay(user) {
        const battleStats = this.calculateBattleStats(user);
        
        // Обновляем информацию об игроке
        const arenaPlayerName = document.getElementById('arena-player-name');
        const arenaPlayerHp = document.getElementById('arena-player-hp');
        const arenaPlayerAttack = document.getElementById('arena-player-attack');
        const arenaPlayerDefense = document.getElementById('arena-player-defense');
        const arenaPlayerFaction = document.getElementById('arena-player-faction');
        
        if (arenaPlayerName) arenaPlayerName.textContent = user.nickname;
        if (arenaPlayerHp) arenaPlayerHp.textContent = battleStats.hp;
        if (arenaPlayerAttack) arenaPlayerAttack.textContent = battleStats.attack;
        if (arenaPlayerDefense) arenaPlayerDefense.textContent = battleStats.defense;
        
        const factionName = user.faction === 'workers' ? 'Работяги' : 'Креаклы';
        if (arenaPlayerFaction) arenaPlayerFaction.textContent = factionName;
        
        // Скрываем результаты предыдущих боев
        const battleResult = document.getElementById('battle-result');
        if (battleResult) battleResult.style.display = 'none';
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
        document.getElementById('start-fight-btn').style.display = 'block';
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
            document.querySelector('.reward-item').style.display = 'flex';
        } else {
            document.querySelector('.reward-item').style.display = 'none';
        }
        
        document.getElementById('reward-gold').textContent = battle.rewards.gold >= 0 ? `+${battle.rewards.gold}` : battle.rewards.gold;
        
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
        
        if (!currentUser || !battle || !battle.rewards) {
            console.error('Не удалось применить награды:', { currentUser, battle });
            return;
        }
        
        console.log('Применяем награды:', battle.rewards);
        
        // Применяем опыт
        if (battle.rewards.exp > 0) {
            currentUser.experience = (currentUser.experience || 0) + battle.rewards.exp;
            
            // Проверяем повышение уровня
            const requiredExp = (currentUser.level || 1) * 100;
            if (currentUser.experience >= requiredExp) {
                currentUser.level = (currentUser.level || 1) + 1;
                currentUser.experience = 0;
                
                // Повышаем все статы на 1
                if (currentUser.stats) {
                    Object.keys(currentUser.stats).forEach(stat => {
                        currentUser.stats[stat] += 1;
                    });
                }
                
                // Даем 50 золота за повышение уровня
                currentUser.gold = (currentUser.gold || 0) + 50;
                
                // Пересчитываем здоровье
                currentUser.health = 50 + (currentUser.stats?.end || 1) * 10;
                
                console.log(`🎉 ПОВЫШЕНИЕ УРОВНЯ! Новый уровень: ${currentUser.level}`);
                
                // Показываем уведомление о повышении уровня
                setTimeout(() => {
                    alert(`🎉 Поздравляем! Вы достигли ${currentUser.level} уровня!\nВсе характеристики увеличены на 1.\nБонус: +50 золота!`);
                }, 500);
            }
        }
        
        // Применяем золото
        currentUser.gold = Math.max(0, (currentUser.gold || 0) + battle.rewards.gold);
        
        console.log('Обновленный пользователь:', currentUser);
        
        // ВАЖНО: Сохраняем изменения в localStorage
        try {
            // Получаем всех пользователей
            const users = window.authSystem.getUsers();
            
            // Находим и обновляем текущего пользователя
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                
                // Сохраняем обновленный список пользователей
                window.authSystem.saveUsers(users);
                
                // Обновляем текущего пользователя в сессии
                window.authSystem.setCurrentUser(currentUser);
                
                console.log('✅ Изменения сохранены в localStorage');
                
                // Обновляем отображение после небольшой задержки
                setTimeout(() => {
                    window.authSystem.displayPlayerInfo(currentUser);
                }, 100);
            } else {
                console.error('❌ Пользователь не найден в списке!');
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения наград:', error);
        }
        
        console.log('Награды применены:', {
            exp: battle.rewards.exp,
            gold: battle.rewards.gold,
            newGold: currentUser.gold,
            newExp: currentUser.experience,
            level: currentUser.level
        });
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
     * Показать спортзал
     */
    showGym() {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) {
            alert('Ошибка: пользователь не найден');
            return;
        }
        
        // Переходим в спортзал
        this.showScreen('gym-screen');
        this.updateGymDisplay(currentUser);
    }
    
    /**
     * Обновить отображение спортзала
     */
    updateGymDisplay(user) {
        // Обновляем золото
        document.getElementById('gym-player-gold').textContent = user.gold || 0;
        
        // Обновляем характеристики
        if (user.stats) {
            document.getElementById('gym-stat-str').textContent = user.stats.str;
            document.getElementById('gym-stat-end').textContent = user.stats.end;
            document.getElementById('gym-stat-dex').textContent = user.stats.dex;
            document.getElementById('gym-stat-int').textContent = user.stats.int;
            document.getElementById('gym-stat-cha').textContent = user.stats.cha;
            document.getElementById('gym-stat-lck').textContent = user.stats.lck;
        }
        
        // Обновляем стоимость тренировок
        this.updateTrainingCosts(user);
    }
    
    /**
     * Обновить стоимость тренировок
     */
    updateTrainingCosts(user) {
        const baseCosts = {
            str: 2.0,   // Самый дорогой
            end: 1.7,   // Второй по дороговизне
            dex: 1.2,   // Средний
            lck: 1.1,   // Чуть дороже базы
            int: 1.0,   // Базовая цена
            cha: 0.8    // Дешевый
        };
        
        Object.keys(baseCosts).forEach(stat => {
            const currentLevel = user.stats[stat];
            const cost = Math.floor(baseCosts[stat] * Math.pow(currentLevel, 1.5) * 10);
            
            const costElement = document.getElementById(`gym-cost-${stat}`);
            const buttonElement = document.querySelector(`[data-stat="${stat}"]`);
            
            if (costElement) {
                costElement.textContent = cost;
                
                if (buttonElement) {
                    // Проверяем, хватает ли денег
                    if (cost > user.gold) {
                        buttonElement.disabled = true;
                        buttonElement.classList.add('cant-afford');
                        buttonElement.classList.remove('expensive');
                    } else {
                        buttonElement.disabled = false;
                        buttonElement.classList.remove('cant-afford');
                        
                        // Красим дорогие статы в красный
                        if (stat === 'str' || stat === 'end') {
                            buttonElement.classList.add('expensive');
                        } else {
                            buttonElement.classList.remove('expensive');
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Инициализация кнопки регистрации с новой системой характеристик
     */
    initRegisterButton() {
        console.log('Инициализация кнопки регистрации...');
        
        setTimeout(() => {
            const btnContinueRegistration = document.getElementById('btn-continue-registration');
            
            if (btnContinueRegistration) {
                // Убираем старые обработчики
                const newBtn = btnContinueRegistration.cloneNode(true);
                btnContinueRegistration.parentNode.replaceChild(newBtn, btnContinueRegistration);
                
                newBtn.addEventListener('click', () => {
                    console.log('Кнопка Продолжить нажата');
                    
                    try {
                        const form = document.getElementById('register-form');
                        if (!form) {
                            console.error('Форма регистрации не найдена');
                            return;
                        }
                        
                        const formData = new FormData(form);
                        const nickname = formData.get('nickname')?.trim() || '';
                        const password = formData.get('password') || '';
                        const passwordRepeat = formData.get('password-repeat') || '';
                        const faction = formData.get('faction') || '';
                        const gender = formData.get('gender') || '';
                        
                        console.log('Данные формы:', { nickname, password, passwordRepeat, faction, gender });
                        
                        // Валидация
                        if (nickname.length < 3) {
                            alert('Никнейм должен содержать минимум 3 символа');
                            return;
                        }
                        
                        if (password.length < 6) {
                            alert('Пароль должен содержать минимум 6 символов');
                            return;
                        }
                        
                        if (password !== passwordRepeat) {
                            alert('Пароли не совпадают');
                            return;
                        }
                        
                        if (!faction) {
                            alert('Выберите фракцию');
                            return;
                        }
                        
                        if (!gender) {
                            alert('Выберите пол персонажа');
                            return;
                        }
                        
                        // Проверка существования пользователя
                        if (window.authSystem && window.authSystem.userExists(nickname)) {
                            alert('Пользователь с таким никнеймом уже существует');
                            return;
                        }
                        
                        // Создаем персонажа с новой системой характеристик
                        window.gameCharacter.setCharacterInfo(nickname, faction, gender);
                        
                        const characterData = window.gameCharacter.getCharacterData();
                        console.log('Создаем персонажа с новой системой:', characterData);
                        
                        // Создаем пользователя
                        if (window.authSystem) {
                            const newUser = window.authSystem.createUser(characterData, password);
                            window.authSystem.setCurrentUser(newUser);
                            
                            console.log('Пользователь создан:', newUser);
                            
                            // Переходим в игру
                            this.showScreen('game-screen');
                            window.authSystem.displayPlayerInfo(newUser);
                            
                            alert('Персонаж создан успешно!');
                        } else {
                            console.error('authSystem не найден');
                        }
                        
                    } catch (error) {
                        console.error('Ошибка при создании персонажа:', error);
                    }
                });
                
                console.log('Обработчик события добавлен к кнопке');
            } else {
                console.error('Кнопка btn-continue-registration не найдена!');
            }
        }, 100);
    }
    
    /**
     * Тренировка характеристики с новой системой стоимости
     */
    trainStat(statName) {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        // Базовые множители стоимости
        const baseCosts = {
            str: 2.0,   // Самый дорогой
            end: 1.7,   // Второй по дороговизне
            dex: 1.2,   // Средний
            lck: 1.1,   // Чуть дороже базы
            int: 1.0,   // Базовая цена
            cha: 0.8    // Дешевый
        };
        
        const currentLevel = currentUser.stats[statName];
        const cost = Math.floor(baseCosts[statName] * Math.pow(currentLevel, 1.5) * 10);
        
        if (currentUser.gold < cost) {
            return; // Просто не выполняем действие
        }
        
        // Увеличиваем характеристику и тратим золото
        currentUser.stats[statName] += 1;
        currentUser.gold -= cost;
        
        // Если тренируем выносливость, пересчитываем здоровье
        if (statName === 'end') {
            currentUser.health = 50 + currentUser.stats.end * 10;
        }
        
        // Сохраняем обновленного пользователя
        const users = window.authSystem.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            window.authSystem.saveUsers(users);
            window.authSystem.setCurrentUser(currentUser);
        }
        
        // Обновляем отображение в спортзале
        this.updateGymDisplay(currentUser);
        
        // Обновляем отображение в основном интерфейсе
        window.authSystem.displayPlayerInfo(currentUser);
        
        console.log('Тренировка завершена:', {
            stat: statName,
            newLevel: currentUser.stats[statName],
            goldSpent: cost,
            remainingGold: currentUser.gold
        });
    }
    
    /**
     * Очистить форму
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Сбрасываем стили валидации
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.style.borderColor = '#444';
            });
        }
    }
    
    /**
     * Проверка автоматического входа
     */
    checkAutoLogin() {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const currentUser = window.authSystem.getCurrentUser();
                if (currentUser) {
                    this.showScreen('game-screen');
                    window.authSystem.displayPlayerInfo(currentUser);
                } else {
                    this.showScreen('loading-screen');
                }
            }, 100);
        });
    }
    
    /**
     * Показать уведомление (убираем визуальные уведомления)
     */
    showNotification(message, type = 'info') {
        // Только в консоль
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    /**
     * Получить статистику игры
     */
    getGameStats() {
        const users = window.authSystem.getUsers();
        const workersCount = users.filter(user => user.faction === 'workers').length;
        const creativesCount = users.filter(user => user.faction === 'creatives').length;
        
        return {
            totalUsers: users.length,
            workersCount,
            creativesCount,
            currentUser: window.authSystem.getCurrentUser()
        };
    }
    
    /**
     * Дебаг информация с новой системой характеристик
     */
    getDebugInfo() {
        const currentUser = window.authSystem.getCurrentUser();
        let characterInfo = null;
        
        if (currentUser && currentUser.stats) {
            // Создаем временный объект Character для расчета скрытых характеристик
            const tempCharacter = new Character();
            tempCharacter.stats = currentUser.stats;
            characterInfo = tempCharacter.getCalculatedStats();
        }
        
        return {
            currentScreen: this.currentScreen,
            gameStats: this.getGameStats(),
            currentUserStats: currentUser ? currentUser.stats : null,
            calculatedStats: characterInfo,
            localStorage: {
                users: localStorage.getItem('mmo_rpg_users'),
                currentUser: localStorage.getItem('mmo_rpg_current_user')
            }
        };
    }
}

// Создаем глобальный экземпляр приложения только если его еще нет
if (!window.gameApp) {
    window.gameApp = new GameApp();
}

// Добавляем глобальные функции для дебага
window.debugGame = () => {
    console.log('=== DEBUG INFO ===');
    console.log(window.gameApp.getDebugInfo());
};

window.debugCharacterCalculations = () => {
    const currentUser = window.authSystem.getCurrentUser();
    if (currentUser && currentUser.stats) {
        const tempCharacter = new Character();
        tempCharacter.stats = currentUser.stats;
        
        console.log('=== РАСЧЕТЫ ХАРАКТЕРИСТИК ===');
        console.log('Основные статы:', currentUser.stats);
        console.log('Рассчитанные характеристики:', tempCharacter.getCalculatedStats());
        console.log('HP:', tempCharacter.calculateHealth());
        console.log('Урон:', tempCharacter.calculateDamage());
        console.log('Шанс двойного удара:', tempCharacter.calculateDoubleHitChance() + '%');
        console.log('Шанс уворота:', tempCharacter.calculateDodgeChance() + '%');
        console.log('Защита:', tempCharacter.calculateDefense());
    } else {
        console.log('Пользователь не найден или нет характеристик');
    }
};

window.clearGameData = () => {
    if (confirm('Удалить все данные игры? Это действие нельзя отменить!')) {
        localStorage.removeItem('mmo_rpg_users');
        localStorage.removeItem('mmo_rpg_current_user');
        window.gameApp.showScreen('loading-screen');
        alert('Данные игры очищены!');
    }
};

// Дополнительная инициализация кнопок арены
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Привязываем кнопки арены напрямую
        const findPlayerBtn = document.getElementById('find-player-btn');
        const findMobBtn = document.getElementById('find-mob-btn');
        const startFightBtn = document.getElementById('start-fight-btn');
        const continueBtn = document.getElementById('continue-btn');
        const arenaBackBtn = document.getElementById('arena-back-btn');
        
        if (findPlayerBtn) {
            findPlayerBtn.onclick = () => {
                console.log('Поиск игрока нажат');
                window.gameApp.findOpponent('player');
            };
        }
        
        if (findMobBtn) {
            findMobBtn.onclick = () => {
                console.log('Поиск моба нажат');
                window.gameApp.findOpponent('mob');
            };
        }
        
        if (startFightBtn) {
            startFightBtn.onclick = () => {
                console.log('Начать бой нажат');
                window.gameApp.startBattle();
            };
        }
        
        if (continueBtn) {
            continueBtn.onclick = () => {
                console.log('Продолжить нажат');
                window.gameApp.returnToArena();
            };
        }
        
        if (arenaBackBtn) {
            arenaBackBtn.onclick = () => {
                console.log('Назад в игру нажат');
                window.gameApp.showScreen('game-screen');
            };
        }
        
        console.log('Кнопки арены привязаны!');
    }, 2000);
});

// Функция для проверки текущего состояния игрока
window.checkPlayerState = () => {
    const currentUser = window.authSystem.getCurrentUser();
    const users = window.authSystem.getUsers();
    const userInList = users.find(u => u.id === currentUser?.id);
    
    console.log('=== СОСТОЯНИЕ ИГРОКА ===');
    console.log('Текущий пользователь (сессия):', currentUser);
    console.log('Пользователь в списке:', userInList);
    console.log('Золото:', currentUser?.gold);
    console.log('Опыт:', currentUser?.experience);
    console.log('Уровень:', currentUser?.level);
    console.log('localStorage (users):', localStorage.getItem('mmo_rpg_users'));
    console.log('localStorage (current):', localStorage.getItem('mmo_rpg_current_user'));
};

// Функция для ручного добавления золота (для тестов)
window.addGold = (amount) => {
    const currentUser = window.authSystem.getCurrentUser();
    if (!currentUser) {
        console.error('Нет активного пользователя');
        return;
    }
    
    currentUser.gold = (currentUser.gold || 0) + amount;
    
    // Сохраняем изменения
    const users = window.authSystem.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        window.authSystem.saveUsers(users);
        window.authSystem.setCurrentUser(currentUser);
        window.authSystem.displayPlayerInfo(currentUser);
        console.log(`✅ Добавлено ${amount} золота. Новый баланс: ${currentUser.gold}`);
    }
};

// Функция для проверки последнего боя
window.checkLastBattle = () => {
    if (window.gameApp && window.gameApp.currentBattle) {
        console.log('=== ПОСЛЕДНИЙ БОЙ ===');
        console.log('Данные боя:', window.gameApp.currentBattle);
        console.log('Награды:', window.gameApp.currentBattle.rewards);
        console.log('Победитель:', window.gameApp.currentBattle.winner);
    } else {
        console.log('Нет данных о последнем бое');
    }
};
