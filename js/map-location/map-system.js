// js/map-location/map-system.js - Основная система локации "Карта" с Supabase
class MapSystem {
    constructor() {
        this.mapMobs = this.initializeMapMobs();
        this.adapter = window.mapSupabaseAdapter; // Используем Supabase адаптер
        
        console.log('🗺️ MapSystem инициализирована с Supabase');
    }
    
    /**
     * Инициализация мобов карты
     */
    initializeMapMobs() {
        return [
            {
                id: 'wolf',
                name: '🐺 Лесной Волк',
                level: 1,
                hp: 200,
                maxHp: 200,
                attack: 20,
                abilities: ['bite', 'howl'],
                unlocked: true, // всегда доступен
                description: 'Агрессивный волк из темного леса. Хорошо для новичков.',
                rewards: { crystals: [2, 4], gold: [20, 35], exp: [15, 25] }
            },
            {
                id: 'troll',
                name: '🧌 Горный Тролль', 
                level: 2,
                hp: 320,
                maxHp: 320,
                attack: 28,
                abilities: ['club_hit', 'earthquake', 'thick_skin'],
                unlocked: false,
                unlockedBy: 'wolf',
                description: 'Массивный тролль с дубиной. Очень живучий противник.',
                rewards: { crystals: [4, 7], gold: [35, 55], exp: [25, 40] }
            },
            {
                id: 'golem',
                name: '❄️ Ледяной Голем',
                level: 3, 
                hp: 480,
                maxHp: 480,
                attack: 35,
                abilities: ['ice_shard', 'ice_storm', 'regeneration'],
                unlocked: false,
                unlockedBy: 'troll',
                description: 'Древний голем изо льда. Может заморозить врагов.',
                rewards: { crystals: [6, 10], gold: [50, 80], exp: [40, 60] }
            },
            {
                id: 'elemental',
                name: '🔥 Огненный Элементаль',
                level: 4,
                hp: 650, 
                maxHp: 650,
                attack: 42,
                abilities: ['fireball', 'inferno', 'flame_rage'],
                unlocked: false,
                unlockedBy: 'golem',
                description: 'Существо из чистого пламени. Становится сильнее при ранении.',
                rewards: { crystals: [8, 15], gold: [70, 120], exp: [60, 90] }
            },
            {
                id: 'dragon', 
                name: '🐉 Древний Дракон',
                level: 5,
                hp: 900,
                maxHp: 900, 
                attack: 55,
                abilities: ['claw_strike', 'fire_breath', 'sky_rage', 'last_breath'],
                unlocked: false,
                unlockedBy: 'elemental',
                isBoss: true,
                description: 'БОСС! Легендарный дракон с мощными способностями и ценным лутом.',
                rewards: { 
                    crystals: [15, 25], 
                    gold: [100, 200], 
                    exp: [100, 150],
                    itemChance: 60 // 60% шанс дропа предмета
                }
            }
        ];
    }
    
    /**
     * Получить доступных для игрока мобов
     */
    async getAvailableMobs(playerNickname) {
        try {
            const playerProgressData = await this.getPlayerProgress(playerNickname);
            const completedMobs = playerProgressData.completed_mobs || [];
            
            // Получаем активные очереди для подсчета игроков
            const activeQueues = await this.adapter.getActiveQueues();
            
            return this.mapMobs.map(mob => {
                const isUnlocked = mob.unlocked || 
                    (mob.unlockedBy && completedMobs.includes(mob.unlockedBy));
                    
                const queueInfo = activeQueues[mob.id];
                const queueCount = queueInfo ? queueInfo.playerCount : 0;
                const inQueue = queueInfo ? queueInfo.players.includes(playerNickname) : false;
                    
                return {
                    ...mob,
                    isUnlocked,
                    inQueue,
                    queueCount
                };
            });
        } catch (error) {
            console.error('❌ Ошибка получения доступных мобов:', error);
            // Fallback к базовой логике
            return this.mapMobs.map(mob => ({
                ...mob,
                isUnlocked: mob.unlocked || false,
                inQueue: false,
                queueCount: 0
            }));
        }
    }
    
    /**
     * Получить прогресс игрока
     */
    async getPlayerProgress(playerNickname) {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                return await this.adapter.getPlayerProgress(playerNickname);
            } else {
                // Fallback к локальному хранению
                const saved = localStorage.getItem(`map_progress_${playerNickname}`);
                if (saved) {
                    return JSON.parse(saved);
                }
                
                const defaultProgress = {
                    player_nickname: playerNickname,
                    completed_mobs: [],
                    crystals: 0
                };
                
                localStorage.setItem(`map_progress_${playerNickname}`, JSON.stringify(defaultProgress));
                return defaultProgress;
            }
        } catch (error) {
            console.error('❌ Ошибка получения прогресса:', error);
            // Fallback
            return {
                player_nickname: playerNickname,
                completed_mobs: [],
                crystals: 0
            };
        }
    }
    
    /**
     * Записать игрока в очередь на моба
     */
    async joinQueue(playerNickname, mobId) {
        try {
            // Проверяем доступность моба
            const availableMobs = await this.getAvailableMobs(playerNickname);
            const mob = availableMobs.find(m => m.id === mobId);
            
            if (!mob || !mob.isUnlocked) {
                throw new Error('Моб недоступен или заблокирован');
            }
            
            if (this.adapter && this.adapter.isConnected()) {
                return await this.adapter.joinQueue(playerNickname, mobId);
            } else {
                throw new Error('Требуется подключение к серверу для мультиплеера');
            }
        } catch (error) {
            console.error('❌ Ошибка записи в очередь:', error);
            throw error;
        }
    }
    
    /**
     * Покинуть очередь
     */
    async leaveQueue(playerNickname) {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                return await this.adapter.leaveQueue(playerNickname);
            } else {
                throw new Error('Требуется подключение к серверу');
            }
        } catch (error) {
            console.error('❌ Ошибка выхода из очереди:', error);
            throw error;
        }
    }

    
    /**
     * Получить максимальное HP игрока
     */
    getPlayerMaxHp(playerNickname) {
        // Интеграция с существующей системой игрока
        if (window.authSystem) {
            const users = window.authSystem.getUsers();
            const player = users.find(u => u.nickname === playerNickname);
            if (player && player.stats) {
                return 50 + (player.stats.end || 1) * 10; // Базовая формула HP
            }
        }
        return 100; // Fallback
    }
    
    /**
     * Получить боевые характеристики игрока
     */
    getPlayerBattleStats(playerNickname) {
        if (window.authSystem) {
            const users = window.authSystem.getUsers();
            const player = users.find(u => u.nickname === playerNickname);
            if (player && player.stats) {
                return {
                    attack: 10 + (player.stats.str || 1) * 3,
                    defense: (player.stats.end || 1) * 2,
                    speed: player.stats.dex || 1,
                    luck: player.stats.lck || 1,
                    intelligence: player.stats.int || 1
                };
            }
        }
        return { attack: 25, defense: 10, speed: 3, luck: 3, intelligence: 1 }; // Fallback
    }

    
    /**
     * Получить активные очереди (для UI)
     */
    async getActiveQueues() {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                return await this.adapter.getActiveQueues();
            } else {
                return {};
            }
        } catch (error) {
            console.error('❌ Ошибка получения очередей:', error);
            return {};
        }
    }
    
    /**
     * Получить активные бои игрока
     */
    async getPlayerActiveBattle(playerNickname) {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                return await this.adapter.getPlayerActiveBattle(playerNickname);
            } else {
                return null;
            }
        } catch (error) {
            console.error('❌ Ошибка получения активного боя:', error);
            return null;
        }
    }
    
    /**
     * Отметить моба как пройденного
     */
    async markMobCompleted(playerNickname, mobId) {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                await this.adapter.markMobCompleted(playerNickname, mobId);
                console.log(`✅ ${playerNickname} завершил моба: ${mobId}`);
            } else {
                // Fallback к localStorage
                const progress = await this.getPlayerProgress(playerNickname);
                if (!progress.completed_mobs.includes(mobId)) {
                    progress.completed_mobs.push(mobId);
                    localStorage.setItem(`map_progress_${playerNickname}`, JSON.stringify(progress));
                }
            }
        } catch (error) {
            console.error('❌ Ошибка отметки завершенного моба:', error);
        }
    }
    
    /**
     * Добавить кристаллы игроку
     */
    async addCrystals(playerNickname, amount) {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                await this.adapter.addCrystals(playerNickname, amount);
                console.log(`💎 ${playerNickname} получил ${amount} кристаллов`);
            } else {
                // Fallback к localStorage
                const progress = await this.getPlayerProgress(playerNickname);
                progress.crystals = (progress.crystals || 0) + amount;
                localStorage.setItem(`map_progress_${playerNickname}`, JSON.stringify(progress));
            }
        } catch (error) {
            console.error('❌ Ошибка добавления кристаллов:', error);
        }
    }
    
    /**
     * Добавить предмет игроку
     */
    async addItem(playerNickname, item) {
        try {
            if (this.adapter && this.adapter.isConnected()) {
                await this.adapter.addItem(playerNickname, item);
                console.log(`🎁 ${playerNickname} получил предмет: ${item.name}`);
            } else {
                console.log(`🎁 ${playerNickname} получил предмет: ${item.name} (не сохранено - нет подключения)`);
            }
        } catch (error) {
            console.error('❌ Ошибка добавления предмета:', error);
        }
    }
    
    /**
     * Получить статистику локации
     */
    async getLocationStats() {
        try {
            const activeQueues = await this.getActiveQueues();
            const queueCount = Object.keys(activeQueues).length;
            
            return {
                totalQueues: queueCount,
                activeBattles: 0, // TODO: подсчет активных боев
                totalProgressRecords: 0, // TODO: подсчет записей прогресса
                mobsData: this.mapMobs.map(mob => ({
                    id: mob.id,
                    name: mob.name,
                    level: mob.level,
                    queueCount: activeQueues[mob.id]?.playerCount || 0
                }))
            };
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error);
            return {
                totalQueues: 0,
                activeBattles: 0,
                totalProgressRecords: 0,
                mobsData: this.mapMobs.map(mob => ({
                    id: mob.id,
                    name: mob.name,
                    level: mob.level,
                    queueCount: 0
                }))
            };
        }
    }
}

// Создаем глобальный экземпляр
if (!window.mapSystem) {
    window.mapSystem = new MapSystem();
    console.log('🗺️ Система карты инициализирована глобально');
}