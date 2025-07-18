// js/supabase-ui.js - ТОЛЬКО SUPABASE, НИКАКИХ ОФФЛАЙН РЕЖИМОВ
class SupabaseUI {
    constructor() {
        this.isInitialized = false;
        this.setupEventListeners();
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSupabase();
        });
    }
    
    // Инициализация Supabase - ТОЛЬКО ОНЛАЙН
    async initializeSupabase() {
        try {
            const success = await window.supabaseClient.initialize();
            
            if (success) {
                this.isInitialized = true;
                this.showConnectionStatus('🌐 Подключено к серверу', 'success');
                this.enhanceGameInterface();
            } else {
                throw new Error('Не удалось подключиться к серверу');
            }
        } catch (error) {
            console.error('КРИТИЧЕСКАЯ ОШИБКА Supabase:', error);
            this.showConnectionStatus('💥 ОШИБКА ПОДКЛЮЧЕНИЯ К СЕРВЕРУ', 'error');
            alert('КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к серверу базы данных!\n\n' + error.message);
        }
    }
    
    // Показать статус подключения
    showConnectionStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 600;
        `;
        statusDiv.textContent = message;
        
        const existing = document.getElementById('connection-status');
        if (existing) existing.remove();
        
        document.body.appendChild(statusDiv);
    }
    
    // Улучшение игрового интерфейса - ТОЛЬКО ОНЛАЙН
    enhanceGameInterface() {
        if (!this.isInitialized) {
            throw new Error('Supabase не инициализирован');
        }
        
        this.createEnhancedWorldMap();
        this.addServerStats();
        this.startWorldStateUpdates();
    }
    
    // Создание онлайн карты мира
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
                                    style="padding: 8px 15px; background: #5e60ce; color: white; border: radius: 5px; cursor: pointer; margin: 0 5px;">↓</button>
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
    
    // Отрисовка карты мира - ТОЛЬКО SUPABASE
    async renderSupabaseWorldMap() {
        const mapContainer = document.getElementById('supabase-world-map');
        if (!mapContainer || !this.isInitialized) return;
        
        try {
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
                    `;
                    
                    const mobsHere = worldState.mobs.filter(m => m.x === x && m.y === y && m.is_alive);
                    
                    if (currentPlayer && currentPlayer.x === x && currentPlayer.y === y) {
                        cell.textContent = '🔸';
                        cell.style.backgroundColor = '#5e60ce';
                        cell.title = `${currentPlayer.nickname} (${currentPlayer.faction})`;
                    } else if (mobsHere.length > 0) {
                        const mob = mobsHere[0];
                        cell.textContent = '👹';
                        cell.style.backgroundColor = '#e74c3c';
                        cell.title = `${mob.name} (${mob.current_hp}/${mob.max_hp} HP)`;
                        cell.dataset.mobId = mob.id;
                        cell.onclick = () => this.attackMob(mob.id);
                    }
                    
                    mapContainer.appendChild(cell);
                }
            }
        } catch (error) {
            console.error('Ошибка отрисовки карты:', error);
            throw error;
        }
    }
    
    // Движение игрока - ТОЛЬКО SUPABASE
    async movePlayer(direction) {
        if (!this.isInitialized) {
            throw new Error('Supabase не инициализирован');
        }
        
        try {
            const result = await window.supabaseClient.movePlayer(direction);
            if (result.success) {
                this.renderSupabaseWorldMap();
            }
        } catch (error) {
            console.error('Ошибка движения:', error);
            alert('Ошибка движения: ' + error.message);
        }
    }
    
    // Атака моба - ТОЛЬКО SUPABASE
    async attackMob(mobId) {
        if (!this.isInitialized) {
            throw new Error('Supabase не инициализирован');
        }
        
        try {
            const battleResult = await window.supabaseClient.attackMob(mobId);
            this.showBattleResult(battleResult);
            
            setTimeout(() => {
                this.renderSupabaseWorldMap();
            }, 1000);
        } catch (error) {
            console.error('Ошибка атаки:', error);
            alert('Ошибка атаки: ' + error.message);
        }
    }
    
    // Показать результат боя
    showBattleResult(battleResult) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 9999;
        `;
        
        const borderColor = battleResult.result === 'victory' ? '#28a745' : '#dc3545';
        
        modal.innerHTML = `
            <div style="background: #2b2d42; padding: 30px; border-radius: 15px; border: 3px solid ${borderColor}; max-width: 500px; color: #edf2f4;">
                <h2 style="text-align: center; margin-bottom: 20px; color: ${borderColor};">
                    ${battleResult.result === 'victory' ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
                </h2>
                
                <div style="background: #3a3f5b; border-radius: 8px; padding: 15px; margin-bottom: 20px; max-height: 200px; overflow-y: auto;">
                    ${battleResult.log.map(entry => `<div style="margin-bottom: 5px; font-size: 14px;">${entry}</div>`).join('')}
                </div>
                
                <div style="text-align: center;">
                    <button onclick="this.parentElement.parentElement.remove();" 
                            style="background: #5e60ce; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Продолжить
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Статистика сервера - ТОЛЬКО SUPABASE
    addServerStats() {
        const gameInterface = document.querySelector('.game-interface');
        if (!gameInterface) return;
        
        let statsSection = document.getElementById('server-stats');
        if (!statsSection) {
            statsSection = document.createElement('div');
            statsSection.id = 'server-stats';
            statsSection.innerHTML = `
                <div style="background: #3a3f5b; border-radius: 8px; padding: 15px; margin-top: 15px;">
                    <h3 style="color: #edf2f4; margin-bottom: 15px; text-align: center;">📊 Сервер онлайн</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center;">
                        <div style="background: #2b2d42; padding: 10px; border-radius: 5px;">
                            <div style="color: #5e60ce; font-size: 20px; font-weight: bold;" id="online-players">0</div>
                            <div style="color: #8d99ae; font-size: 12px;">Игроков</div>
                        </div>
                        <div style="background: #2b2d42; padding: 10px; border-radius: 5px;">
                            <div style="color: #e74c3c; font-size: 20px; font-weight: bold;" id="active-mobs">0</div>
                            <div style="color: #8d99ae; font-size: 12px;">Мобов</div>
                        </div>
                    </div>
                </div>
            `;
            gameInterface.appendChild(statsSection);
        }
        
        this.updateServerStats();
        setInterval(() => this.updateServerStats(), 10000);
    }
    
    // Обновление статистики - ТОЛЬКО SUPABASE
    async updateServerStats() {
        if (!this.isInitialized) return;
        
        try {
            const worldState = window.supabaseClient.getWorldState();
            
            document.getElementById('online-players').textContent = worldState.players.length || 0;
            document.getElementById('active-mobs').textContent = (worldState.mobs.filter(m => m.is_alive).length) || 0;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
        }
    }
    

    

    
    // Автообновления - ТОЛЬКО SUPABASE
    startWorldStateUpdates() {
        if (!this.isInitialized) return;
        
        setInterval(async () => {
            try {
                await window.supabaseClient.loadWorldState();
                this.renderSupabaseWorldMap();
                this.updateServerStats();
            } catch (error) {
                console.error('КРИТИЧЕСКАЯ ОШИБКА обновления:', error);
                alert('КРИТИЧЕСКАЯ ОШИБКА подключения к серверу!');
            }
        }, 5000);
    }
}

// Создаем ТОЛЬКО если Supabase доступен
if (!window.supabaseUI) {
    window.supabaseUI = new SupabaseUI();
}

console.log('✅ Supabase UI создан - ТОЛЬКО ОНЛАЙН РЕЖИМ');
