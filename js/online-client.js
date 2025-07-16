// js/online-client-fixed.js - Исправленный клиент для работы с Vercel API
class OnlineGameClient {
    constructor() {
        // Для Vercel используем относительный путь
        this.apiBase = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : '/api';
        
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
        console.log('🔄 Инициализация онлайн режима...');
        console.log('API Base:', this.apiBase);
        
        try {
            const currentUser = window.authSystem.getCurrentUser();
            if (!currentUser) {
                console.log('❌ Пользователь не авторизован');
                return false;
            }

            console.log('📤 Отправляем запрос на присоединение:', currentUser);

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

            console.log('📥 Ответ сервера:', response);

            if (response.success) {
                this.playerId = response.playerId;
                this.worldState = response.worldState;
                this.isConnected = true;
                
                console.log('✅ Успешно подключились к серверу!', this.playerId);
                
                // Запускаем периодическое обновление
                this.startUpdates();
                
                // Показываем онлайн интерфейс
                this.renderOnlineInterface();
                
                return true;
            } else {
                throw new Error('Не удалось присоединиться к игре');
            }
        } catch (error) {
            console.error('❌ Ошибка подключения к серверу:', error);
            this.showMessage('Не удалось подключиться к серверу. Игра в оффлайн режиме.', 'error');
            return false;
        }
    }

    // Универсальный метод для API вызовов с улучшенной обработкой ошибок
    async makeApiCall(endpoint, method = 'GET', data = null) {
        const url = this.apiBase + endpoint;
        console.log(`🌐 API вызов: ${method} ${url}`, data);
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            // Важно для CORS
            mode: 'cors',
            credentials: 'same-origin'
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            console.log('📡 Статус ответа:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка сервера:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Данные получены:', result);
            return result;
        } catch (error) {
            console.error('❌ Ошибка запроса:', error);
            throw error;
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
                console.error('❌ Ошибка обновления:', error);
                // Не отключаемся сразу, даем шанс восстановиться
            }
        }, 5000); // Обновляем каждые 5 секунд (увеличил интервал)
    }

    // Получение состояния мира
    async updateWorldState() {
        console.log('🔄 Обновление состояния мира...');
        
        try {
            const response = await this.makeApiCall('/players', 'GET');
            
            if (response.players) {
                this.worldState.players = response.players;
                this.worldState.mobs = response.mobs || [];
                this.worldState.lastUpdate = response.timestamp;
                
                console.log(`✅ Мир обновлен: ${response.players.length} игроков, ${response.mobs.length} мобов`);
                
                // Обновляем интерфейс
                this.renderWorldMap();
                this.updateOnlineCount();
            }
        } catch (error) {
            console.error('❌ Ошибка обновления мира:', error);
            // Не выбрасываем ошибку дальше, просто логируем
        }
    }

    // Отрисовка карты мира
    renderWorldMap() {
        const mapContainer = document.getElementById('online-world-map');
        if (!mapContainer) {
            console.log('⚠️ Контейнер карты не найден');
            return;
        }

        const mapSize = 15;
        mapContainer.innerHTML = '';
        mapContainer.style.display = 'grid';
        mapContainer.style.gridTemplateColumns = `repeat(${mapSize}, 30px)`;
        mapContainer.style.gap = '1px';
        mapContainer.style.justifyContent = 'center';

        const currentUser = window.authSystem.getCurrentUser();
        const currentPlayer = this.worldState.players.find(p => p.id === this.playerId);

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
                    transition: all 0.2s ease;
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
                    
                    cell.title = playersHere.map(p => `${p.nickname} (${p.faction === 'workers' ? 'Работяга' : 'Креакл'}, ур.${p.level || 1})`).join('\n');
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

                cell.onmouseover = () => {
                    cell.style.boxShadow = '0 0 5px rgba(94, 96, 206, 0.5)';
                };
                
                cell.onmouseout = () => {
                    cell.style.boxShadow = 'none';
                };

                mapContainer.appendChild(cell);
            }
        }
    }

    // Показать уведомление
    showMessage(text, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${text}`);
        
        // Создаем визуальное уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = text;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Остановка обновлений
    stopUpdates() {
        console.log('🛑 Остановка обновлений...');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isConnected = false;
    }

    // Движение игрока
    async movePlayer(direction) {
        if (!this.isConnected) {
            this.showMessage('Нет подключения к серверу', 'error');
            return;
        }

        console.log(`🚶 Движение: ${direction}`);

        try {
            const response = await this.makeApiCall('/players', 'POST', {
                action: 'move',
                playerData: {
                    id: this.playerId,
                    direction: direction
                }
            });

            if (response.success) {
                console.log('✅ Переместились:', response.newPosition);
                
                // Сразу обновляем состояние
                await this.updateWorldState();
                
                // Проверяем встречи с мобами
                if (response.mobsEncountered && response.mobsEncountered.length > 0) {
                    this.handleMobEncounter(response.mobsEncountered);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка движения:', error);
            this.showMessage('Ошибка перемещения', 'error');
        }
    }

    // Обработка встречи с мобом
    handleMobEncounter(mobs) {
        const mob = mobs[0];
        this.showMessage(`Вы встретили ${mob.name}! Нажмите на моба для атаки.`, 'warning');
    }

    // Обновление счетчика онлайн
    updateOnlineCount() {
        const countElement = document.getElementById('online-count');
        if (countElement) {
            countElement.textContent = this.worldState.players.length;
        }
    }

    // Отрисовка онлайн интерфейса
    renderOnlineInterface() {
        console.log('🎨 Создание онлайн интерфейса...');
        
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) {
            console.error('❌ Игровой интерфейс не найден!');
            return;
        }

        // Проверяем, есть ли уже онлайн интерфейс
        let onlineSection = document.getElementById('online-section');
        if (!onlineSection) {
            onlineSection = document.createElement('div');
            onlineSection.id = 'online-section';
            onlineSection.innerHTML = `
                <div style="margin-top: 20px; background: #3a3f5b; border-radius: 8px; padding: 15px; border: 1px solid #8d99ae;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #edf2f4; margin: 0;">🌐 Онлайн режим</h3>
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
                    
                    <!-- Статус подключения -->
                    <div style="text-align: center; padding: 10px; background: #2b2d42; border-radius: 5px;">
                        <span style="color: #28a745; font-weight: bold;">✅ Подключено к серверу</span>
                    </div>
                </div>
            `;
            gameInterface.appendChild(onlineSection);
        }

        // Добавляем стили для анимаций
        if (!document.getElementById('online-animations')) {
            const style = document.createElement('style');
            style.id = 'online-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        this.renderWorldMap();
        console.log('✅ Онлайн интерфейс создан');
    }
}

// Создаем глобальный экземпляр онлайн клиента
if (window.onlineClient) {
    window.onlineClient.stopUpdates();
}
window.onlineClient = new OnlineGameClient();

// Автоматическая инициализация при входе в игру
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, настраиваем интеграцию...');
    
    if (window.gameApp) {
        const originalShowScreen = window.gameApp.showScreen;
        window.gameApp.showScreen = function(screenId) {
            originalShowScreen.call(this, screenId);
            
            if (screenId === 'game-screen') {
                console.log('🎮 Переход на игровой экран, активируем онлайн режим...');
                
                // Подключаемся к онлайн серверу
                setTimeout(async () => {
                    const success = await window.onlineClient.initialize();
                    if (success) {
                        console.log('🌐 Онлайн режим активирован!');
                    } else {
                        console.log('💾 Работаем в оффлайн режиме');
                    }
                }, 1000);
            } else {
                // Отключаемся при выходе из игры
                window.onlineClient.stopUpdates();
            }
        };
    }
});

// Добавляем глобальную функцию для отладки
window.debugOnline = () => {
    console.log('=== ОНЛАЙН ОТЛАДКА ===');
    console.log('Подключен:', window.onlineClient.isConnected);
    console.log('Player ID:', window.onlineClient.playerId);
    console.log('Состояние мира:', window.onlineClient.worldState);
    console.log('API Base:', window.onlineClient.apiBase);
};
