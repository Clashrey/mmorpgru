// js/online-client.js - Клиент для работы с Vercel API
class OnlineGameClient {
    constructor() {
        this.apiBase = '/api'; // Для Vercel Serverless Functions
        this.playerId = null;
        this.worldState = {
            players: [],
            mobs: [],
            lastUpdate: 0
        };
        this.updateInterval = null;
        this.chatMessages = [];
        this.isConnected = false;
    }

    // Инициализация онлайн режима
    async initialize() {
        try {
            const currentUser = window.authSystem.getCurrentUser();
            if (!currentUser) {
                console.log('Пользователь не авторизован');
                return false;
            }

            // Присоединяемся к игре
            const response = await this.makeApiCall('/players', 'POST', {
                action: 'join',
                playerData: {
                    nickname: currentUser.nickname,
                    faction: currentUser.faction,
                    level: currentUser.level || 1,
                    stats: currentUser.stats || {}
                }
            });

            if (response.success) {
                this.playerId = response.playerId;
                this.worldState = response.worldState;
                this.isConnected = true;
                
                console.log('Успешно подключились к серверу!', this.playerId);
                
                // Запускаем периодическое обновление
                this.startUpdates();
                
                // Показываем онлайн интерфейс
                this.renderOnlineInterface();
                
                return true;
            } else {
                throw new Error('Не удалось присоединиться к игре');
            }
        } catch (error) {
            console.error('Ошибка подключения к серверу:', error);
            this.showMessage('Не удалось подключиться к серверу. Игра в оффлайн режиме.', 'error');
            return false;
        }
    }

    // Запуск периодических обновлений
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            try {
                await this.updateWorldState();
            } catch (error) {
                console.error('Ошибка обновления:', error);
                this.handleConnectionError();
            }
        }, 2000); // Обновляем каждые 2 секунды
    }

    // Остановка обновлений
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isConnected = false;
    }

    // Получение состояния мира
    async updateWorldState() {
        const response = await this.makeApiCall('/players', 'GET');
        
        if (response.players) {
            this.worldState.players = response.players;
            this.worldState.mobs = response.mobs || [];
            this.worldState.lastUpdate = response.timestamp;
            
            // Обновляем интерфейс
            this.renderWorldMap();
            this.updateOnlineCount();
        }
    }

    // Движение игрока
    async movePlayer(direction) {
        if (!this.isConnected) return;

        try {
            const response = await this.makeApiCall('/players', 'POST', {
                action: 'move',
                playerData: {
                    id: this.playerId,
                    direction: direction
                }
            });

            if (response.success) {
                // Сразу обновляем состояние
                await this.updateWorldState();
                
                // Проверяем встречи с мобами
                if (response.mobsEncountered && response.mobsEncountered.length > 0) {
                    this.handleMobEncounter(response.mobsEncountered);
                }
            }
        } catch (error) {
            console.error('Ошибка движения:', error);
        }
    }

    // Атака моба
    async attackMob(mobId) {
        if (!this.isConnected) return;

        try {
            const response = await this.makeApiCall('/players', 'POST', {
                action: 'attack_mob',
                playerData: {
                    id: this.playerId,
                    mobId: mobId
                }
            });

            if (response.success) {
                this.handleBattleResult(response.battleResult);
                // Обновляем состояние мира
                await this.updateWorldState();
            }
        } catch (error) {
            console.error('Ошибка атаки:', error);
            this.showMessage('Ошибка атаки моба', 'error');
        }
    }

    // Отправка сообщения в чат
    async sendChatMessage(message) {
        if (!this.isConnected || !message.trim()) return;

        try {
            const response = await this.makeApiCall('/players', 'POST', {
                action: 'chat',
                playerData: {
                    id: this.playerId,
                    message: message.trim()
                }
            });

            if (response.success) {
                // Добавляем сообщение в локальный чат
                this.addChatMessage(response.message);
            }
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    }

    // Обработка встречи с мобом
    handleMobEncounter(mobs) {
        const mob = mobs[0]; // Берем первого моба
        this.showMessage(`Вы встретили ${mob.name}! Нажмите на моба для атаки.`, 'warning');
    }

    // Обработка результата боя
    handleBattleResult(battleResult) {
        const currentUser = window.authSystem.getCurrentUser();
        
        if (battleResult.result === 'victory') {
            this.showMessage(`Победа! +${battleResult.rewards.exp} опыта, +${battleResult.rewards.gold} золота`, 'success');
            
            // Обновляем характеристики игрока
            if (currentUser) {
                currentUser.experience = (currentUser.experience || 0) + battleResult.rewards.exp;
                currentUser.gold = (currentUser.gold || 0) + battleResult.rewards.gold;
                
                // Проверяем повышение уровня
                this.checkLevelUp(currentUser);
                
                window.authSystem.setCurrentUser(currentUser);
                window.authSystem.displayPlayerInfo(currentUser);
            }
        } else if (battleResult.result === 'defeat') {
            this.showMessage('Поражение в бою!', 'error');
        } else {
            // Бой продолжается
            battleResult.log.forEach(logEntry => {
                this.showMessage(logEntry, 'info');
            });
        }
    }

    // Проверка повышения уровня
    checkLevelUp(user) {
        const requiredExp = (user.level || 1) * 100;
        if (user.experience >= requiredExp) {
            user.level = (user.level || 1) + 1;
            user.experience = 0;
            
            // Увеличиваем все статы на 1
            Object.keys(user.stats).forEach(stat => {
                user.stats[stat] += 1;
            });
            
            // Бонус золота за уровень
            user.gold = (user.gold || 0) + 50;
            
            this.showMessage(`🎉 НОВЫЙ УРОВЕНЬ ${user.level}! Все характеристики увеличены!`, 'success');
        }
    }

    // Отрисовка карты мира
    renderWorldMap() {
        const mapContainer = document.getElementById('online-world-map');
        if (!mapContainer) return;

        const mapSize = 15;
        mapContainer.innerHTML = '';
        mapContainer.style.display = 'grid';
        mapContainer.style.gridTemplateColumns = `repeat(${mapSize}, 30px)`;
        mapContainer.style.gap = '1px';
        mapContainer.style.justifyContent = 'center';

        const currentUser = window.authSystem.getCurrentUser();
        const currentPlayer = this.worldState.players.find(p => p.nickname === currentUser?.nickname);

        for (let y = 0; y < mapSize; y++) {
            for (let x = 0; x < mapSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'world-cell';
                cell.style.cssText = `
                    width: 30px;
                    height: 30px;
                    border: 1px solid #444;
                    background: #2b2d42;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    position: relative;
                    cursor: pointer;
                `;

                // Игроки на этой позиции
                const playersHere = this.worldState.players.filter(p => p.x === x && p.y === y);
                // Мобы на этой позиции
                const mobsHere = this.worldState.mobs.filter(m => m.x === x && m.y === y && m.hp > 0);

                if (playersHere.length > 0) {
                    const isCurrentPlayer = currentPlayer && currentPlayer.x === x && currentPlayer.y === y;
                    
                    if (isCurrentPlayer) {
                        cell.textContent = '🔸';
                        cell.style.backgroundColor = '#5e60ce';
                    } else {
                        cell.textContent = '👤';
                        cell.style.backgroundColor = '#8d99ae';
                    }
                    
                    cell.title = playersHere.map(p => `${p.nickname} (${p.faction === 'workers' ? 'Работяга' : 'Креакл'}, ур.${p.level})`).join('\n');
                } else if (mobsHere.length > 0) {
                    cell.textContent = '👹';
                    cell.style.backgroundColor = '#e74c3c';
                    cell.title = mobsHere.map(m => `${m.name} (${m.hp}/${m.maxHp} HP)`).join('\n');
                    
                    // Клик по мобу для атаки
                    cell.onclick = () => {
                        if (currentPlayer && Math.abs(currentPlayer.x - x) + Math.abs(currentPlayer.y - y) <= 1) {
                            this.attackMob(mobsHere[0].id);
                        } else {
                            this.showMessage('Слишком далеко от моба!', 'warning');
                        }
                    };
                }

                mapContainer.appendChild(cell);
            }
        }
    }

    // Отрисовка онлайн интерфейса
    renderOnlineInterface() {
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) return;

        // Проверяем, есть ли уже онлайн интерфейс
        let onlineSection = document.getElementById('online-section');
        if (!onlineSection) {
            onlineSection = document.createElement('div');
            onlineSection.id = 'online-section';
            onlineSection.innerHTML = `
                <div style="margin-top: 20px; background: #3a3f5b; border-radius: 8px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #edf2f4; margin: 0;">🌐 Онлайн игра</h3>
                        <div style="color: #5e60ce; font-weight: bold;">
                            Игроков онлайн: <span id="online-count">0</span>
                        </div>
                    </div>
                    
                    <!-- Карта мира -->
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: #edf2f4; margin-bottom: 10px; text-align: center;">🗺️ Карта мира (15x15)</h4>
                        <div id="online-world-map"></div>
                    </div>
                    
                    <!-- Управление -->
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div style="margin-bottom: 10px;">
                            <button onclick="window.onlineClient.movePlayer('up')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">↑</button>
                        </div>
                        <div>
                            <button onclick="window.onlineClient.movePlayer('left')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">←</button>
                            <button onclick="window.onlineClient.movePlayer('down')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">↓</button>
                            <button onclick="window.onlineClient.movePlayer('right')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">→</button>
                        </div>
                    </div>
                    
                    <!-- Чат -->
                    <div style="border-top: 1px solid #8d99ae; padding-top: 15px;">
                        <h4 style="color: #edf2f4; margin-bottom: 10px;">💬 Глобальный чат</h4>
                        <div id="online-chat-messages" style="background: #2b2d42; border-radius: 5px; padding: 10px; height: 120px; overflow-y: auto; margin-bottom: 10px; font-size: 13px;"></div>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="online-chat-input" placeholder="Введите сообщение..." 
                                   style="flex: 1; padding: 8px; border: 1px solid #444; border-radius: 5px; background: #2b2d42; color: #edf2f4;">
                            <button onclick="window.onlineClient.sendChatFromInput()" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer;">Отправить</button>
                        </div>
                    </div>
                </div>
            `;
            gameInterface.appendChild(onlineSection);

            // Обработчик Enter для чата
            document.getElementById('online-chat-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatFromInput();
                }
            });
        }

        this.renderWorldMap();
    }

    // Отправка сообщения из поля ввода
    sendChatFromInput() {
        const input = document.getElementById('online-chat-input');
        if (input && input.value.trim()) {
            this.sendChatMessage(input.value);
            input.value = '';
        }
    }

    // Добавление сообщения в чат
    addChatMessage(message) {
        const chatContainer = document.getElementById('online-chat-messages');
        if (!chatContainer) return;

        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            margin-bottom: 8px;
            padding: 6px;
            border-radius: 4px;
            border-left: 3px solid ${message.faction === 'workers' ? '#5e60ce' : '#e74c3c'};
            background: rgba(43, 45, 66, 0.3);
        `;

        const time = new Date(message.timestamp).toLocaleTimeString();
        const factionIcon = message.faction === 'workers' ? '⚙️' : '🎨';

        messageEl.innerHTML = `
            <div style="color: #8d99ae; font-size: 11px; margin-bottom: 2px;">${time} ${factionIcon}</div>
            <div style="color: #edf2f4;"><strong>${message.playerName}:</strong> ${message.message}</div>
        `;

        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Ограничиваем количество сообщений
        if (chatContainer.children.length > 50) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
    }

    // Обновление счетчика онлайн
    updateOnlineCount() {
        const countElement = document.getElementById('online-count');
        if (countElement) {
            countElement.textContent = this.worldState.players.length;
        }
    }

    // Показать уведомление
    showMessage(text, type = 'info') {
        // Используем существующую систему уведомлений
        if (window.gameApp && window.gameApp.showNotification) {
            window.gameApp.showNotification(text, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${text}`);
        }
    }

    // Обработка ошибки соединения
    handleConnectionError() {
        if (this.isConnected) {
            this.showMessage('Потеряно соединение с сервером', 'error');
            this.stopUpdates();
        }
    }

    // Универсальный метод для API вызовов
    async makeApiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(this.apiBase + endpoint, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
}

// Создаем глобальный экземпляр онлайн клиента
if (!window.onlineClient) {
    window.onlineClient = new OnlineGameClient();
}

// Автоматическая инициализация при входе в игру
document.addEventListener('DOMContentLoaded', () => {
    const originalShowScreen = window.gameApp.showScreen;
    window.gameApp.showScreen = function(screenId) {
        originalShowScreen.call(this, screenId);
        
        if (screenId === 'game-screen') {
            // Подключаемся к онлайн серверу
            setTimeout(async () => {
                const success = await window.onlineClient.initialize();
                if (success) {
                    console.log('Онлайн режим активирован!');
                } else {
                    console.log('Работаем в оффлайн режиме');
                }
            }, 1000);
        } else {
            // Отключаемся при выходе из игры
            window.onlineClient.stopUpdates();
        }
    };
});
