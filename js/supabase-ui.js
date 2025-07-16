// js/supabase-ui.js - UI интеграция с Supabase
class SupabaseUI {
    constructor() {
        this.isInitialized = false;
        this.setupEventListeners();
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Слушаем обновления мира от Supabase
        window.addEventListener('worldUpdate', (event) => {
            this.handleWorldUpdate(event.detail);
        });
        
        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSupabase();
        });
    }
    
    // Инициализация Supabase
    async initializeSupabase() {
        try {
            const success = await window.supabaseClient.initialize();
            
            if (success) {
                this.isInitialized = true;
                this.showConnectionStatus('✅ Подключено к серверу базы данных', 'success');
                this.enhanceGameInterface();
            } else {
                this.showConnectionStatus('⚠️ Работаем в оффлайн режиме', 'warning');
            }
        } catch (error) {
            console.error('Ошибка инициализации Supabase:', error);
            this.showConnectionStatus('❌ Ошибка подключения к БД', 'error');
        }
    }
    
    // Показать статус подключения
    showConnectionStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 10px 15px;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 600;
        `;
        statusDiv.textContent = message;
        
        // Удаляем предыдущий статус
        const existing = document.getElementById('connection-status');
        if (existing) existing.remove();
        
        document.body.appendChild(statusDiv);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            if (statusDiv.parentElement) {
                statusDiv.remove();
            }
        }, 5000);
    }
    
    // Улучшение игрового интерфейса для работы с БД
    enhanceGameInterface() {
        // Заменяем существующие обработчики движения
        this.enhanceMovementControls();
        
        // Улучшаем чат с realtime обновлениями
        this.enhanceChat();
        
        // Добавляем статистику сервера
        this.addServerStats();
        
        // Улучшаем боевую систему
        this.enhanceBattleSystem();
        
        // Создаем онлайн карту
        this.createEnhancedWorldMap();
        
        // Интеграция с системой тренировок
        this.enhanceTrainingSystem();
        
        // Улучшаем систему выхода
        this.enhanceLogoutSystem();
        
        // Запускаем автообновления
        this.startWorldStateUpdates();
    }
    
    // Создание расширенной карты мира
    createEnhancedWorldMap() {
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) return;
        
        let mapSection = document.getElementById('enhanced-world-map');
        if (!mapSection) {
            mapSection = document.createElement('div');
            mapSection.id = 'enhanced-world-map';
            mapSection.innerHTML = `
                <div style="background: #3a3f5b; border-radius: 8px; padding: 15px; margin-top: 15px;">
                    <h3 style="color: #edf2f4; margin-bottom: 15px; text-align: center;">🗺️ Онлайн карта мира (15x15)</h3>
                    
                    <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                        <div style="display: flex; gap: 15px; font-size: 12px;">
                            <div><span style="color: #5e60ce;">🔸</span> Вы</div>
                            <div><span style="color: #8d99ae;">👤</span> Игроки</div>
                            <div><span style="color: #e74c3c;">👹</span> Мобы</div>
                        </div>
                    </div>
                    
                    <div id="supabase-world-map" style="justify-content: center;"></div>
                    
                    <div style="text-align: center; margin-top: 15px;">
                        <div style="margin-bottom: 10px;">
                            <button onclick="window.supabaseUI.movePlayer('up')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer;">↑</button>
                        </div>
                        <div>
                            <button onclick="window.supabaseUI.movePlayer('left')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">←</button>
                            <button onclick="window.supabaseUI.movePlayer('down')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">↓</button>
                            <button onclick="window.supabaseUI.movePlayer('right')" 
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px;">→</button>
                        </div>
                    </div>
                </div>
            `;
            gameInterface.appendChild(mapSection);
        }
        
        this.renderSupabaseWorldMap();
    }
    
    // Отрисовка карты мира с данными Supabase
    async renderSupabaseWorldMap() {
        const mapContainer = document.getElementById('supabase-world-map');
        if (!mapContainer || !this.isInitialized) return;
        
        const worldState = window.supabaseClient.getWorldState();
        const currentPlayer = window.supabaseClient.getCurrentPlayer();
        
        mapContainer.innerHTML = '';
        mapContainer.style.display = 'grid';
        mapContainer.style.gridTemplateColumns = 'repeat(15, 25px)';
        mapContainer.style.gap = '1px';
        
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                const cell = document.createElement('div');
                cell.className = 'world-cell';
                cell.style.cssText = `
                    width: 25px;
                    height: 25px;
                    border: 1px solid #444;
                    background: #2b2d42;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    cursor: pointer;
                    position: relative;
                `;
                
                // Игроки на этой позиции
                const playersHere = worldState.players.filter(p => p.x === x && p.y === y);
                // Мобы на этой позиции
                const mobsHere = worldState.mobs.filter(m => m.x === x && m.y === y && m.is_alive);
                
                if (playersHere.length > 0) {
                    const isCurrentPlayer = currentPlayer && playersHere.some(p => p.id === currentPlayer.id);
                    
                    if (isCurrentPlayer) {
                        cell.textContent = '🔸';
                        cell.style.backgroundColor = '#5e60ce';
                    } else {
                        cell.textContent = '👤';
                        cell.style.backgroundColor = '#8d99ae';
                    }
                    
                    cell.title = playersHere.map(p => `${p.nickname} (${p.faction === 'workers' ? 'Работяга' : 'Креакл'}, ур.${p.level})`).join('\n');
                } else if (mobsHere.length > 0) {
                    const mob = mobsHere[0];
                    cell.textContent = '👹';
                    cell.style.backgroundColor = '#e74c3c';
                    cell.title = `${mob.name} (${mob.current_hp}/${mob.max_hp} HP)`;
                    cell.dataset.mobId = mob.id;
                    
                    // Клик по мобу для атаки
                    cell.onclick = () => this.attackMob(mob.id);
                }
                
                mapContainer.appendChild(cell);
            }
        }
    }
    
    // Движение игрока через UI
    async movePlayer(direction) {
        if (!this.isInitialized || !window.supabaseClient.isOnline()) {
            this.showNotification('Нет подключения к серверу', 'error');
            return;
        }
        
        try {
            const result = await window.supabaseClient.movePlayer(direction);
            if (result.success) {
                this.renderSupabaseWorldMap();
                
                if (result.mobsEncountered.length > 0) {
                    this.showMobEncounter(result.mobsEncountered[0]);
                }
            }
        } catch (error) {
            this.showNotification(`Ошибка движения: ${error.message}`, 'error');
        }
    }
    
    // Атака моба через UI
    async attackMob(mobId) {
        if (!this.isInitialized || !window.supabaseClient.isOnline()) {
            this.showNotification('Нет подключения к серверу', 'error');
            return;
        }
        
        try {
            const battleResult = await window.supabaseClient.attackMob(mobId);
            this.showBattleResult(battleResult);
            
            // Обновляем карту после боя
            setTimeout(() => {
                this.renderSupabaseWorldMap();
            }, 1000);
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    // Показать результат боя
    showBattleResult(battleResult) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        const resultClass = battleResult.result === 'victory' ? 'victory' : 'defeat';
        const borderColor = battleResult.result === 'victory' ? '#28a745' : '#dc3545';
        
        modal.innerHTML = `
            <div style="background: #2b2d42; padding: 30px; border-radius: 15px; border: 3px solid ${borderColor}; max-width: 500px; color: #edf2f4;">
                <h2 style="text-align: center; margin-bottom: 20px; color: ${borderColor};">
                    ${battleResult.result === 'victory' ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
                </h2>
                
                <div style="background: #3a3f5b; border-radius: 8px; padding: 15px; margin-bottom: 20px; max-height: 200px; overflow-y: auto;">
                    ${battleResult.log.map(entry => `<div style="margin-bottom: 5px; font-size: 14px;">${entry}</div>`).join('')}
                </div>
                
                ${battleResult.result === 'victory' ? `
                    <div style="background: #28a745; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 10px;">Награды:</h3>
                        <div>⭐ Опыт: +${battleResult.rewards.exp}</div>
                        <div>💰 Золото: +${battleResult.rewards.gold}</div>
                        ${battleResult.levelUp ? `<div style="color: #ffce56; font-weight: bold;">🎉 НОВЫЙ УРОВЕНЬ ${battleResult.newLevel}!</div>` : ''}
                    </div>
                ` : ''}
                
                <div style="text-align: center;">
                    <button onclick="this.parentElement.parentElement.remove(); window.supabaseUI.updateGameInterface();" 
                            style="background: #5e60ce; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Продолжить
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Добавление статистики сервера
    addServerStats() {
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) return;
        
        let statsSection = document.getElementById('server-stats');
        if (!statsSection) {
            statsSection = document.createElement('div');
            statsSection.id = 'server-stats';
            statsSection.innerHTML = `
                <div style="background: #3a3f5b; border-radius: 8px; padding: 15px; margin-top: 15px;">
                    <h3 style="color: #edf2f4; margin-bottom: 15px; text-align: center;">📊 Статистика сервера</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center;">
                        <div style="background: #2b2d42; padding: 10px; border-radius: 5px;">
                            <div style="color: #5e60ce; font-size: 20px; font-weight: bold;" id="online-players">0</div>
                            <div style="color: #8d99ae; font-size: 12px;">Игроков онлайн</div>
                        </div>
                        <div style="background: #2b2d42; padding: 10px; border-radius: 5px;">
                            <div style="color: #e74c3c; font-size: 20px; font-weight: bold;" id="active-mobs">0</div>
                            <div style="color: #8d99ae; font-size: 12px;">Активных мобов</div>
                        </div>
                        <div style="background: #2b2d42; padding: 10px; border-radius: 5px;">
                            <div style="color: #28a745; font-size: 20px; font-weight: bold;" id="faction-workers">0</div>
                            <div style="color: #8d99ae; font-size: 12px;">Работяги</div>
                        </div>
                        <div style="background: #2b2d42; padding: 10px; border-radius: 5px;">
                            <div style="color: #ff6b6b; font-size: 20px; font-weight: bold;" id="faction-creatives">0</div>
                            <div style="color: #8d99ae; font-size: 12px;">Креаклы</div>
                        </div>
                    </div>
                </div>
            `;
            gameInterface.appendChild(statsSection);
        }
        
        // Обновляем статистику каждые 10 секунд
        this.updateServerStats();
        setInterval(() => this.updateServerStats(), 10000);
    }
    
    // Обновление статистики сервера
    async updateServerStats() {
        if (!this.isInitialized) return;
        
        try {
            const worldState = window.supabaseClient.getWorldState();
            
            const workersCount = worldState.players.filter(p => p.faction === 'workers').length;
            const creativesCount = worldState.players.filter(p => p.faction === 'creatives').length;
            
            document.getElementById('online-players').textContent = worldState.players.length;
            document.getElementById('active-mobs').textContent = worldState.mobs.filter(m => m.is_alive).length;
            document.getElementById('faction-workers').textContent = workersCount;
            document.getElementById('faction-creatives').textContent = creativesCount;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
        }
    }
    
    // Улучшение управления движением
    enhanceMovementControls() {
        // Заменяем стандартные кнопки движения нашими
        setTimeout(() => {
            const moveButtons = document.querySelectorAll('[onclick*="move"]');
            moveButtons.forEach(button => {
                const originalOnclick = button.getAttribute('onclick');
                if (originalOnclick && originalOnclick.includes('multiplayerClient.move')) {
                    button.removeAttribute('onclick');
                    
                    button.addEventListener('click', async () => {
                        if (this.isInitialized && window.supabaseClient.isOnline()) {
                            // Извлекаем направление из оригинального onclick
                            const direction = originalOnclick.match(/'(\w+)'/)[1];
                            await this.movePlayer(direction);
                        } else {
                            // Fallback на оригинальную логику
                            eval(originalOnclick);
                        }
                    });
                }
            });
        }, 2000);
    }
    
    // Улучшение чата
    enhanceChat() {
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) return;
        
        let chatSection = document.getElementById('supabase-chat-section');
        if (!chatSection) {
            chatSection = document.createElement('div');
            chatSection.id = 'supabase-chat-section';
            chatSection.innerHTML = `
                <div style="background: #3a3f5b; border-radius: 8px; padding: 15px; margin-top: 15px;">
                    <h3 style="color: #edf2f4; margin-bottom: 15px; text-align: center;">💬 Глобальный чат</h3>
                    <div id="supabase-chat-messages" style="background: #2b2d42; border-radius: 5px; padding: 10px; height: 150px; overflow-y: auto; margin-bottom: 10px; font-size: 13px;"></div>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="supabase-chat-input" placeholder="Введите сообщение..." 
                               style="flex: 1; padding: 8px; border: 1px solid #444; border-radius: 5px; background: #2b2d42; color: #edf2f4;">
                        <button onclick="window.supabaseUI.sendChatFromInput()" 
                                style="padding: 8px 15px; background: #5e60ce; color: white; border: none; border-radius: 5px; cursor: pointer;">Отправить</button>
                    </div>
                </div>
            `;
            gameInterface.appendChild(chatSection);
            
            // Обработчик Enter для чата
            document.getElementById('supabase-chat-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatFromInput();
                }
            });
        }
        
        // Загружаем существующие сообщения
        this.loadChatMessages();
    }
    
    // Загрузка сообщений чата
    loadChatMessages() {
        if (!this.isInitialized) return;
        
        const worldState = window.supabaseClient.getWorldState();
        const chatContainer = document.getElementById('supabase-chat-messages');
        
        if (chatContainer && worldState.chatMessages) {
            chatContainer.innerHTML = '';
            worldState.chatMessages.forEach(message => {
                this.addRealtimeChatMessage(message);
            });
        }
    }
    
    // Отправка сообщения из поля ввода
    async sendChatFromInput() {
        const input = document.getElementById('supabase-chat-input');
        if (!input || !input.value.trim()) return;
        
        if (this.isInitialized && window.supabaseClient.isOnline()) {
            try {
                await window.supabaseClient.sendChatMessage(input.value);
                input.value = '';
            } catch (error) {
                this.showNotification('Ошибка отправки сообщения', 'error');
            }
        } else {
            this.showNotification('Нет подключения к серверу', 'error');
        }
    }
    
    // Добавление realtime сообщения в чат
    addRealtimeChatMessage(messageData) {
        const chatContainer = document.getElementById('supabase-chat-messages');
        if (!chatContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 5px;
            border-left: 3px solid ${messageData.players?.faction === 'workers' ? '#5e60ce' : '#e74c3c'};
            background: rgba(43, 45, 66, 0.3);
            font-size: 13px;
        `;
        
        const time = new Date(messageData.created_at).toLocaleTimeString();
        const factionIcon = messageData.players?.faction === 'workers' ? '⚙️' : '🎨';
        
        messageEl.innerHTML = `
            <div style="color: #8d99ae; font-size: 11px; margin-bottom: 2px;">${time} ${factionIcon}</div>
            <div style="color: #edf2f4;"><strong>${messageData.players?.nickname || 'Аноним'}:</strong> ${messageData.message}</div>
        `;
        
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Ограничиваем количество сообщений
        if (chatContainer.children.length > 50) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
    }
    
    // Интеграция с системой тренировок
    enhanceTrainingSystem() {
        setTimeout(() => {
            const upgradeButtons = document.querySelectorAll('.upgrade-btn');
            upgradeButtons.forEach(button => {
                const originalOnclick = button.onclick;
                
                button.onclick = async (event) => {
                    if (this.isInitialized && window.supabaseClient.isOnline()) {
                        const stat = button.dataset.stat;
                        const costText = button.textContent.match(/(\d+)/);
                        const cost = costText ? parseInt(costText[1]) : 0;
                        
                        try {
                            await window.supabaseClient.trainStat(stat, cost);
                            this.updateGameInterface();
                            this.showNotification(`${stat.toUpperCase()} увеличена!`, 'success');
                        } catch (error) {
                            this.showNotification(error.message, 'error');
                        }
                    } else {
                        // Fallback на оригинальную логику
                        if (originalOnclick) {
                            originalOnclick.call(button, event);
                        }
                    }
                };
            });
        }, 2000);
    }
    
    // Улучшение боевой системы
    enhanceBattleSystem() {
        // Перехватываем клики по мобам в существующем интерфейсе
        document.addEventListener('click', async (event) => {
            const target = event.target;
            
            // Если кликнули по мобу (ищем по классу или data-атрибуту)
            if (target.classList.contains('world-cell') && target.textContent === '👹' && target.dataset.mobId) {
                if (this.isInitialized && window.supabaseClient.isOnline()) {
                    const mobId = target.dataset.mobId;
                    if (mobId) {
                        try {
                            const battleResult = await window.supabaseClient.attackMob(mobId);
                            this.showBattleResult(battleResult);
                        } catch (error) {
                            this.showNotification(error.message, 'error');
                        }
                    }
                }
            }
        });
    }
    
    // Интеграция с существующей системой выхода
    enhanceLogoutSystem() {
        const logoutButton = document.getElementById('btn-logout');
        if (logoutButton) {
            const originalOnclick = logoutButton.onclick;
            
            logoutButton.onclick = async () => {
                if (this.isInitialized && window.supabaseClient.isOnline()) {
                    await window.supabaseClient.logout();
                }
                
                // Вызываем оригинальную логику
                if (originalOnclick) {
                    originalOnclick();
                }
            };
        }
    }
    
    // Автоматическое обновление состояния мира
    startWorldStateUpdates() {
        if (!this.isInitialized) return;
        
        setInterval(async () => {
            try {
                await window.supabaseClient.loadWorldState();
                this.renderSupabaseWorldMap();
                this.updateServerStats();
            } catch (error) {
                console.error('Ошибка обновления состояния мира:', error);
            }
        }, 5000); // Обновляем каждые 5 секунд
    }
    
    // Обработка обновлений мира от Supabase
    handleWorldUpdate(detail) {
        const { type, data } = detail;
        
        switch (type) {
            case 'player_moved':
                this.renderSupabaseWorldMap();
                break;
            case 'chat_message':
                this.addRealtimeChatMessage(data);
                break;
            case 'mob_updated':
                this.renderSupabaseWorldMap();
                break;
        }
    }
    
    // Обновление интерфейса игры
    updateGameInterface() {
        if (this.isInitialized && window.supabaseClient.isOnline()) {
            const currentPlayer = window.supabaseClient.getCurrentPlayer();
            if (currentPlayer && window.authSystem) {
                window.authSystem.displayPlayerInfo(currentPlayer);
            }
        }
    }
    
    // Показать уведомление
    showNotification(message, type = 'info') {
        if (window.gameApp && window.gameApp.showNotification) {
            window.gameApp.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // Показать встречу с мобом
    showMobEncounter(mob) {
        this.showNotification(`Вы встретили ${mob.name}! Нажмите на моба для атаки.`, 'warning');
    }
}

// Создаем глобальный экземпляр
if (!window.supabaseUI) {
    window.supabaseUI = new SupabaseUI();
}

// Интеграция с существующей системой игры
document.addEventListener('DOMContentLoaded', () => {
    // Ждем полной загрузки игры, затем инициализируем Supabase UI
    setTimeout(() => {
        if (window.supabaseUI.isInitialized) {
            console.log('✅ Supabase UI полностью инициализирован');
        }
    }, 3000);
    
    // Интеграция с переключением экранов
    if (window.gameApp) {
        const originalShowScreen = window.gameApp.showScreen;
        window.gameApp.showScreen = function(screenId) {
            originalShowScreen.call(this, screenId);
            
            if (screenId === 'game-screen' && window.supabaseUI.isInitialized) {
                setTimeout(() => {
                    window.supabaseUI.renderSupabaseWorldMap();
                    window.supabaseUI.updateServerStats();
                }, 1000);
            }
        };
    }
});
