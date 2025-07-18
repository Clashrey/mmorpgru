// js/map-location/map-ui.js - Интерфейс локации карты
class MapLocationUI {
    constructor() {
        this.currentView = 'mob_list'; // mob_list, queue_waiting, battle_active
        this.selectedMob = null;
        this.battleData = null;
        this.updateInterval = null;
        
        console.log('🎨 MapLocationUI инициализирован');
    }
    
    /**
     * Создать интерфейс локации карты
     */
    createMapLocationInterface() {
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) return;
        
        // Удаляем существующий интерфейс карты если есть
        const existingMapInterface = document.getElementById('map-location-interface');
        if (existingMapInterface) {
            existingMapInterface.remove();
        }
        
        const mapInterface = document.createElement('div');
        mapInterface.id = 'map-location-interface';
        mapInterface.innerHTML = `
            <div class="map-location-container">
                <div class="map-header">
                    <h2>🗺️ ЛОКАЦИЯ: КАРТА</h2>
                    <p>Кооперативные бои против усиливающихся мобов</p>
                    <div class="player-resources">
                        <div class="resource-item">
                            <span class="resource-icon">💎</span>
                            <span class="resource-label">Кристаллы:</span>
                            <span class="resource-value" id="player-crystals">0</span>
                        </div>
                    </div>
                </div>
                
                <!-- Список мобов -->
                <div id="mob-list-view" class="map-view active">
                    <div class="mobs-grid" id="mobs-grid">
                        <!-- Мобы будут добавлены динамически -->
                    </div>
                </div>
                
                <!-- Ожидание в очереди -->
                <div id="queue-waiting-view" class="map-view">
                    <div class="queue-container">
                        <div class="queue-header">
                            <h3 id="queue-mob-name">🐺 Лесной Волк</h3>
                            <div class="queue-status" id="queue-status">Ищем напарника...</div>
                        </div>
                        
                        <div class="queue-players">
                            <div class="queue-player filled">
                                <div class="player-avatar">👤</div>
                                <div class="player-name" id="queue-player1">Вы</div>
                            </div>
                            <div class="queue-vs">VS</div>
                            <div class="queue-player" id="queue-player2-slot">
                                <div class="player-avatar">❓</div>
                                <div class="player-name">Ищем...</div>
                            </div>
                        </div>
                        
                        <div class="queue-timer" id="queue-timer" style="display: none;">
                            <div class="timer-circle">
                                <span class="timer-text" id="timer-text">60</span>
                            </div>
                            <div class="timer-label">Подготовка к бою</div>
                        </div>
                        
                        <div class="queue-actions">
                            <button class="map-btn secondary" id="leave-queue-btn">Покинуть очередь</button>
                        </div>
                    </div>
                </div>
                
                <!-- Активный бой -->
                <div id="battle-active-view" class="map-view">
                    <div class="battle-container">
                        <div class="battle-header">
                            <h3 id="battle-mob-name">🐺 Лесной Волк</h3>
                            <div class="battle-turn">Ход: <span id="battle-turn-number">1</span></div>
                        </div>
                        
                        <!-- Статусы участников -->
                        <div class="battle-participants">
                            <div class="participants-row">
                                <div class="participant player" id="battle-player1">
                                    <div class="participant-name">Игрок 1</div>
                                    <div class="participant-hp">
                                        <div class="hp-bar">
                                            <div class="hp-fill" style="width: 100%"></div>
                                        </div>
                                        <div class="hp-text">100/100</div>
                                    </div>
                                    <div class="participant-action" id="player1-action">Выбирает действие...</div>
                                </div>
                                
                                <div class="participant player" id="battle-player2">
                                    <div class="participant-name">Игрок 2</div>
                                    <div class="participant-hp">
                                        <div class="hp-bar">
                                            <div class="hp-fill" style="width: 100%"></div>
                                        </div>
                                        <div class="hp-text">100/100</div>
                                    </div>
                                    <div class="participant-action" id="player2-action">Выбирает действие...</div>
                                </div>
                            </div>
                            
                            <div class="vs-divider">VS</div>
                            
                            <div class="participant mob" id="battle-mob">
                                <div class="participant-name">Моб</div>
                                <div class="participant-hp">
                                    <div class="hp-bar mob-hp">
                                        <div class="hp-fill" style="width: 100%"></div>
                                    </div>
                                    <div class="hp-text">200/200</div>
                                </div>
                                <div class="participant-effects" id="mob-effects"></div>
                            </div>
                        </div>
                        
                        <!-- Действия игрока -->
                        <div class="battle-actions" id="battle-actions">
                            <h4>Выберите действие:</h4>
                            <div class="actions-grid">
                                <button class="action-btn available" data-action="attack">
                                    <div class="action-icon">⚔️</div>
                                    <div class="action-name">Обычная атака</div>
                                    <div class="action-desc">Базовая атака</div>
                                </button>
                                <button class="action-btn" data-action="power_strike" id="power-strike-btn">
                                    <div class="action-icon">💥</div>
                                    <div class="action-name">Мощный удар</div>
                                    <div class="action-desc">x1.8 урона</div>
                                    <div class="action-cooldown" id="power-strike-cd"></div>
                                </button>
                                <button class="action-btn available" data-action="defend">
                                    <div class="action-icon">🛡️</div>
                                    <div class="action-name">Защита</div>
                                    <div class="action-desc">-60% урона</div>
                                </button>
                                <button class="action-btn" data-action="heal" id="heal-btn">
                                    <div class="action-icon">💚</div>
                                    <div class="action-name">Исцеление</div>
                                    <div class="action-desc">+35% HP</div>
                                    <div class="action-uses" id="heal-uses">2/2</div>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Лог боя -->
                        <div class="battle-log">
                            <h4>📜 Ход боя:</h4>
                            <div class="log-entries" id="battle-log-entries"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Результат боя -->
                <div id="battle-result-view" class="map-view">
                    <div class="result-container">
                        <div class="result-header">
                            <h2 id="result-title">🏆 ПОБЕДА!</h2>
                            <p id="result-message">Моб повержен!</p>
                        </div>
                        
                        <div class="result-rewards" id="result-rewards">
                            <!-- Награды будут добавлены динамически -->
                        </div>
                        
                        <div class="result-actions">
                            <button class="map-btn primary" id="return-to-map-btn">Вернуться к карте</button>
                        </div>
                    </div>
                </div>
                
                <!-- Кнопка возврата -->
                <div class="map-controls">
                    <button class="map-btn secondary" id="map-back-btn">🏠 Вернуться в игру</button>
                </div>
            </div>
        `;
        
        gameInterface.appendChild(mapInterface);
        this.setupEventListeners();
        this.updateMobsList();
        this.startPeriodicUpdates();
        
        console.log('🎨 Интерфейс локации карты создан');
    }
    
    /**
     * Настроить обработчики событий
     */
    setupEventListeners() {
        // Возврат в игру
        document.getElementById('map-back-btn').addEventListener('click', () => {
            this.hideMapLocation();
        });
        
        // Покинуть очередь
        document.getElementById('leave-queue-btn').addEventListener('click', () => {
            this.leaveQueue();
        });
        
        // Действия в бою
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                if (e.currentTarget.classList.contains('available')) {
                    this.selectBattleAction(action);
                }
            });
        });
        
        // Возврат к карте из результатов
        document.getElementById('return-to-map-btn').addEventListener('click', () => {
            this.showView('mob_list');
            this.updateMobsList();
        });
    }
    
    /**
     * Обновить список мобов
     */
    updateMobsList() {
        const currentPlayer = window.authSystem.getCurrentUser();
        if (!currentPlayer) return;
        
        const mobsGrid = document.getElementById('mobs-grid');
        if (!mobsGrid) return;
        
        const availableMobs = window.mapSystem.getAvailableMobs(currentPlayer.nickname);
        const playerProgress = window.mapSystem.getPlayerProgress(currentPlayer.nickname);
        
        // Обновляем кристаллы
        document.getElementById('player-crystals').textContent = playerProgress.crystals || 0;
        
        mobsGrid.innerHTML = '';
        
        availableMobs.forEach(mob => {
            const mobCard = document.createElement('div');
            mobCard.className = `mob-card ${mob.isUnlocked ? 'unlocked' : 'locked'}`;
            
            const isCompleted = playerProgress.completedMobs.includes(mob.id);
            const queueInfo = mob.queueCount > 0 ? `В очереди: ${mob.queueCount}/2` : 'Свободно';
            
            mobCard.innerHTML = `
                <div class="mob-header">
                    <div class="mob-icon">${mob.name.split(' ')[0]}</div>
                    <div class="mob-info">
                        <div class="mob-name">${mob.name}</div>
                        <div class="mob-level">Уровень ${mob.level}</div>
                    </div>
                    ${isCompleted ? '<div class="mob-completed">✅</div>' : ''}
                </div>
                
                <div class="mob-stats">
                    <div class="stat-item">
                        <span class="stat-icon">❤️</span>
                        <span class="stat-value">${mob.hp}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">⚔️</span>
                        <span class="stat-value">${mob.attack}</span>
                    </div>
                </div>
                
                <div class="mob-description">${mob.description}</div>
                
                <div class="mob-rewards">
                    <div class="reward-item">
                        <span class="reward-icon">💎</span>
                        <span class="reward-text">${mob.rewards.crystals[0]}-${mob.rewards.crystals[1]}</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">💰</span>
                        <span class="reward-text">${mob.rewards.gold[0]}-${mob.rewards.gold[1]}</span>
                    </div>
                    ${mob.isBoss ? '<div class="reward-item boss-loot"><span class="reward-icon">🎁</span><span class="reward-text">Предметы</span></div>' : ''}
                </div>
                
                <div class="mob-queue-info">${queueInfo}</div>
                
                <div class="mob-actions">
                    ${mob.isUnlocked ? 
                        `<button class="mob-btn ${mob.inQueue ? 'in-queue' : 'join-queue'}" 
                                data-mob-id="${mob.id}" 
                                ${mob.inQueue ? 'disabled' : ''}>
                            ${mob.inQueue ? 'В очереди' : 'Записаться (2 игрока)'}
                        </button>` :
                        `<button class="mob-btn locked" disabled>
                            Заблокировано (пройдите ${mob.unlockedBy})
                        </button>`
                    }
                </div>
            `;
            
            mobsGrid.appendChild(mobCard);
        });
        
        // Добавляем обработчики для кнопок записи
        document.querySelectorAll('.mob-btn.join-queue').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mobId = e.target.dataset.mobId;
                this.joinMobQueue(mobId);
            });
        });
    }
    
    /**
     * Записаться в очередь на моба
     */
    async joinMobQueue(mobId) {
        const currentPlayer = window.authSystem.getCurrentUser();
        if (!currentPlayer) {
            alert('Ошибка: игрок не найден');
            return;
        }
        
        try {
            const result = window.mapSystem.joinQueue(currentPlayer.nickname, mobId);
            
            if (result.success) {
                // Получаем данные моба
                const availableMobs = window.mapSystem.getAvailableMobs(currentPlayer.nickname);
                this.selectedMob = availableMobs.find(m => m.id === mobId);
                
                // Переходим к виду очереди
                this.showQueueView();
                this.updateQueueView();
                
                console.log(`✅ Записались в очередь на ${this.selectedMob.name}`);
            }
        } catch (error) {
            alert(`Ошибка записи в очередь: ${error.message}`);
            console.error('❌ Ошибка записи в очередь:', error);
        }
    }
    
    /**
     * Покинуть очередь
     */
    leaveQueue() {
        const currentPlayer = window.authSystem.getCurrentUser();
        if (!currentPlayer) return;
        
        try {
            const result = window.mapSystem.leaveQueue(currentPlayer.nickname);
            
            if (result.success) {
                this.showView('mob_list');
                this.updateMobsList();
                console.log('✅ Покинули очередь');
            }
        } catch (error) {
            console.error('❌ Ошибка выхода из очереди:', error);
        }
    }
    
    /**
     * Показать вид очереди
     */
    showQueueView() {
        this.showView('queue_waiting');
        
        // Заполняем информацию о мобе
        document.getElementById('queue-mob-name').textContent = this.selectedMob.name;
        
        // Получаем данные очереди
        const queueData = window.mapSystem.getActiveQueues()[this.selectedMob.id];
        
        if (queueData) {
            this.updateQueueStatus(queueData);
        }
    }
    
    /**
     * Обновить статус очереди
     */
    updateQueueStatus(queueData) {
        const statusEl = document.getElementById('queue-status');
        const player2Slot = document.getElementById('queue-player2-slot');
        const timerEl = document.getElementById('queue-timer');
        
        if (queueData.playerCount === 1) {
            statusEl.textContent = 'Ищем напарника...';
            player2Slot.innerHTML = `
                <div class="player-avatar">❓</div>
                <div class="player-name">Ищем...</div>
            `;
            timerEl.style.display = 'none';
        } else if (queueData.playerCount === 2) {
            statusEl.textContent = 'Напарник найден! Подготовка...';
            const otherPlayer = queueData.players.find(p => p !== window.authSystem.getCurrentUser().nickname);
            player2Slot.innerHTML = `
                <div class="player-avatar">👤</div>
                <div class="player-name">${otherPlayer}</div>
            `;
            
            if (queueData.hasTimer) {
                timerEl.style.display = 'block';
                this.startCountdown();
            }
        }
    }
    
    /**
     * Запустить обратный отсчет
     */
    startCountdown() {
        let timeLeft = 60;
        const timerText = document.getElementById('timer-text');
        
        const countdown = setInterval(() => {
            timerText.textContent = timeLeft;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(countdown);
                // Проверяем, начался ли бой
                this.checkForActiveBattle();
            }
        }, 1000);
    }
    
    /**
     * Проверить активный бой
     */
    checkForActiveBattle() {
        const currentPlayer = window.authSystem.getCurrentUser();
        if (!currentPlayer) return;
        
        const activeBattle = window.mapSystem.getPlayerActiveBattle(currentPlayer.nickname);
        
        if (activeBattle) {
            this.battleData = activeBattle;
            this.showBattleView();
        }
    }
    
    /**
     * Показать вид боя
     */
    showBattleView() {
        this.showView('battle_active');
        this.updateBattleView();
    }
    
    /**
     * Обновить вид боя
     */
    updateBattleView() {
        if (!this.battleData) return;
        
        const currentPlayer = window.authSystem.getCurrentUser();
        
        // Обновляем заголовок
        document.getElementById('battle-mob-name').textContent = this.battleData.mobData.name;
        document.getElementById('battle-turn-number').textContent = this.battleData.currentTurn;
        
        // Обновляем участников
        this.updateBattleParticipants();
        
        // Обновляем действия игрока
        this.updateBattleActions(currentPlayer.nickname);
        
        // Обновляем лог
        this.updateBattleLog();
    }
    
    /**
     * Обновить участников боя
     */
    updateBattleParticipants() {
        const players = this.battleData.players;
        const mob = this.battleData.mobData;
        
        // Обновляем игроков
        players.forEach((player, index) => {
            const playerEl = document.getElementById(`battle-player${index + 1}`);
            if (playerEl) {
                playerEl.querySelector('.participant-name').textContent = player.nickname;
                
                const hpFill = playerEl.querySelector('.hp-fill');
                const hpText = playerEl.querySelector('.hp-text');
                const hpPercent = (player.currentHp / player.maxHp) * 100;
                
                hpFill.style.width = `${hpPercent}%`;
                hpText.textContent = `${player.currentHp}/${player.maxHp}`;
                
                // Статус действия
                const actionEl = playerEl.querySelector('.participant-action');
                const hasAction = this.battleData.playerActions[player.nickname];
                actionEl.textContent = hasAction ? 
                    `Выбрал: ${hasAction.action.name}` : 
                    'Выбирает действие...';
            }
        });
        
        // Обновляем моба
        const mobEl = document.getElementById('battle-mob');
        if (mobEl) {
            mobEl.querySelector('.participant-name').textContent = mob.name;
            
            const hpFill = mobEl.querySelector('.hp-fill');
            const hpText = mobEl.querySelector('.hp-text');
            const hpPercent = (mob.currentHp / mob.maxHp) * 100;
            
            hpFill.style.width = `${hpPercent}%`;
            hpText.textContent = `${mob.currentHp}/${mob.maxHp}`;
        }
    }
    
    /**
     * Обновить действия игрока
     */
    updateBattleActions(playerNickname) {
        const player = this.battleData.players.find(p => p.nickname === playerNickname);
        if (!player) return;
        
        // Проверяем доступность мощного удара
        const powerStrikeBtn = document.getElementById('power-strike-btn');
        const powerStrikeCd = document.getElementById('power-strike-cd');
        
        if (player.actions.powerStrikeCooldown > 0) {
            powerStrikeBtn.classList.remove('available');
            powerStrikeCd.textContent = `${player.actions.powerStrikeCooldown} ходов`;
        } else {
            powerStrikeBtn.classList.add('available');
            powerStrikeCd.textContent = '';
        }
        
        // Проверяем доступность лечения
        const healBtn = document.getElementById('heal-btn');
        const healUses = document.getElementById('heal-uses');
        const remainingHeals = 2 - player.actions.healsUsed;
        
        if (remainingHeals > 0) {
            healBtn.classList.add('available');
        } else {
            healBtn.classList.remove('available');
        }
        healUses.textContent = `${remainingHeals}/2`;
        
        // Проверяем, выбрал ли игрок действие
        const hasAction = this.battleData.playerActions[playerNickname];
        if (hasAction) {
            // Блокируем все кнопки если действие уже выбрано
            document.querySelectorAll('.action-btn').forEach(btn => {
                btn.classList.remove('available');
                btn.classList.add('selected');
            });
        }
    }
    
    /**
     * Выбрать действие в бою
     */
    selectBattleAction(actionType) {
        const currentPlayer = window.authSystem.getCurrentUser();
        if (!currentPlayer || !this.battleData) return;
        
        try {
            const result = window.mapBattleSystem.processPlayerAction(
                this.battleData, 
                currentPlayer.nickname, 
                actionType
            );
            
            if (result.success) {
                console.log(`⚔️ Выбрано действие: ${actionType}`);
                this.updateBattleActions(currentPlayer.nickname);
                
                // Если бой завершился, показываем результат
                if (this.battleData.status === 'finished') {
                    setTimeout(() => {
                        this.showBattleResult();
                    }, 2000);
                }
            }
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
            console.error('❌ Ошибка выбора действия:', error);
        }
    }
    
    /**
     * Обновить лог боя
     */
    updateBattleLog() {
        const logEntries = document.getElementById('battle-log-entries');
        if (!logEntries || !this.battleData) return;
        
        logEntries.innerHTML = '';
        
        this.battleData.battleLog.forEach(entry => {
            const logEl = document.createElement('div');
            logEl.className = `log-entry ${entry.type}`;
            logEl.innerHTML = `
                <span class="log-turn">Ход ${entry.turn}:</span>
                <span class="log-message">${entry.message}</span>
            `;
            logEntries.appendChild(logEl);
        });
        
        // Прокручиваем к последнему сообщению
        logEntries.scrollTop = logEntries.scrollHeight;
    }
    
    /**
     * Показать результат боя
     */
    showBattleResult() {
        if (!this.battleData || !this.battleData.result) return;
        
        this.showView('battle_result');
        
        const result = this.battleData.result;
        const titleEl = document.getElementById('result-title');
        const messageEl = document.getElementById('result-message');
        const rewardsEl = document.getElementById('result-rewards');
        
        // Заголовок результата
        if (result.result === 'victory') {
            titleEl.textContent = '🏆 ПОБЕДА!';
            titleEl.className = 'result-title victory';
        } else {
            titleEl.textContent = '💀 ПОРАЖЕНИЕ';
            titleEl.className = 'result-title defeat';
        }
        
        messageEl.textContent = result.message;
        
        // Награды (только при победе)
        rewardsEl.innerHTML = '';
        if (result.result === 'victory') {
            const currentPlayer = window.authSystem.getCurrentUser();
            const progress = window.mapSystem.getPlayerProgress(currentPlayer.nickname);
            
            // Показываем полученные награды
            const rewards = this.battleData.mobData.rewards;
            
            rewardsEl.innerHTML = `
                <h3>🎁 Награды получены:</h3>
                <div class="rewards-list">
                    <div class="reward-item">
                        <span class="reward-icon">💎</span>
                        <span class="reward-text">Кристаллы: ${rewards.crystals[0]}-${rewards.crystals[1]}</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">💰</span>
                        <span class="reward-text">Золото: ${rewards.gold[0]}-${rewards.gold[1]}</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">⭐</span>
                        <span class="reward-text">Опыт: ${rewards.exp[0]}-${rewards.exp[1]}</span>
                    </div>
                    ${this.battleData.mobData.isBoss ? 
                        '<div class="reward-item boss-reward"><span class="reward-icon">🎁</span><span class="reward-text">Шанс на предмет: 60%</span></div>' : 
                        ''
                    }
                </div>
            `;
        }
    }
    
    /**
     * Показать определенный вид
     */
    showView(viewName) {
        // Скрываем все виды
        document.querySelectorAll('.map-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Показываем нужный вид
        const targetView = document.getElementById(`${viewName.replace('_', '-')}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        this.currentView = viewName;
    }
    
    /**
     * Запустить периодические обновления
     */
    startPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.currentView === 'mob_list') {
                this.updateMobsList();
            } else if (this.currentView === 'queue_waiting') {
                this.updateQueueView();
            } else if (this.currentView === 'battle_active') {
                this.checkForBattleUpdates();
            }
        }, 2000);
    }
    
    /**
     * Обновить вид очереди
     */
    updateQueueView() {
        if (!this.selectedMob) return;
        
        const queueData = window.mapSystem.getActiveQueues()[this.selectedMob.id];
        
        if (queueData) {
            this.updateQueueStatus(queueData);
        } else {
            // Очередь была отменена, возвращаемся к списку
            this.showView('mob_list');
            this.updateMobsList();
        }
    }
    
    /**
     * Проверить обновления боя
     */
    checkForBattleUpdates() {
        const currentPlayer = window.authSystem.getCurrentUser();
        if (!currentPlayer) return;
        
        const activeBattle = window.mapSystem.getPlayerActiveBattle(currentPlayer.nickname);
        
        if (activeBattle && activeBattle.id === this.battleData?.id) {
            this.battleData = activeBattle;
            this.updateBattleView();
            
            // Проверяем завершение боя
            if (activeBattle.status === 'finished') {
                this.showBattleResult();
            }
        } else if (!activeBattle && this.currentView === 'battle_active') {
            // Бой завершился, возвращаемся к карте
            this.showView('mob_list');
            this.updateMobsList();
        }
    }
    
    /**
     * Скрыть интерфейс карты
     */
    hideMapLocation() {
        const mapInterface = document.getElementById('map-location-interface');
        if (mapInterface) {
            mapInterface.remove();
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Возвращаемся в основную игру
        window.gameApp.showScreen('game-screen');
        
        console.log('🎨 Интерфейс карты скрыт');
    }
}

// Создаем глобальный экземпляр
if (!window.mapLocationUI) {
    window.mapLocationUI = new MapLocationUI();
    console.log('🎨 UI локации карты инициализирован');
}