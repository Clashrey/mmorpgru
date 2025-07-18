// js/supabase-client.js - ТОЛЬКО SUPABASE, НИКАКИХ ЛОКАЛЬНЫХ МЕХАНИЗМОВ
class SupabaseGameClient {
    constructor() {
        this.supabaseUrl = 'https://gkqhsscmxzvbaabesoch.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrcWhzc2NteHp2YmFhYmVzb2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Nzc0MTQsImV4cCI6MjA2ODI1MzQxNH0.CcqxRWMosNa6UP1XaRpBcmBSrB44PGQpBrsSSuC45j0';
        this.supabase = null;
        this.currentPlayer = null;
        this.isConnected = false;
        this.worldState = {
            players: [],
            mobs: [],
            chatMessages: []
        };
    }
    
    // Инициализация Supabase
    async initialize() {
        try {
            if (typeof window.supabase === 'undefined') {
                console.error('❌ Supabase SDK не загружен');
                return false;
            }
            
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                    detectSessionInUrl: false
                }
            });
            
            // Проверка соединения
            const { data, error } = await this.supabase
                .from('players')
                .select('id')
                .limit(1);
            
            if (error) {
                console.error('❌ Ошибка БД:', error);
                throw error;
            }
            
            console.log('✅ Supabase подключен!');
            this.isConnected = true;
            this.setupRealtimeSubscriptions();
            return true;
            
        } catch (error) {
            console.error('❌ Критическая ошибка Supabase:', error);
            this.isConnected = false;
            throw error;
        }
    }
    
    // Регистрация игрока - ТОЛЬКО SUPABASE
    async registerPlayer(characterData, password) {
        if (!this.isConnected) {
            throw new Error('Supabase не подключен');
        }
        
        console.log('🔐 Регистрируем игрока:', characterData);
        
        const { data: newPlayer, error } = await this.supabase
            .from('players')
            .insert({
                nickname: characterData.nickname,
                password: password,
                faction: characterData.faction,
                gender: characterData.gender
            })
            .select()
            .single();
            
        if (error) {
            console.error('❌ Ошибка регистрации:', error);
            throw new Error(`Ошибка регистрации: ${error.message}`);
        }
        
        console.log('✅ Игрок зарегистрирован:', newPlayer);
        this.currentPlayer = this.convertPlayerFormat(newPlayer);
        return this.currentPlayer;
    }
    
    // Авторизация игрока - ТОЛЬКО SUPABASE
    async loginPlayer(nickname, password) {
        if (!this.isConnected) {
            throw new Error('Supabase не подключен');
        }
        
        console.log('🔐 Авторизация:', nickname);
        
        const { data: player, error } = await this.supabase
            .from('players')
            .select('*')
            .eq('nickname', nickname)
            .eq('password', password)
            .single();
            
        if (error || !player) {
            throw new Error('Неверный логин или пароль');
        }
        
        console.log('✅ Авторизация успешна:', player);
        this.currentPlayer = this.convertPlayerFormat(player);
        return this.currentPlayer;
    }
    
    // Конвертация формата игрока из БД
    convertPlayerFormat(dbPlayer) {
        return {
            id: dbPlayer.id,
            nickname: dbPlayer.nickname,
            faction: dbPlayer.faction,
            gender: dbPlayer.gender,
            level: dbPlayer.level || 1,
            experience: dbPlayer.experience || 0,
            gold: dbPlayer.gold || 100,
            health: dbPlayer.health || 70,
            stats: {
                str: dbPlayer.str || 5,
                end: dbPlayer.end_stat || 5,
                dex: dbPlayer.dex || 3,
                int: dbPlayer.int || 1,
                cha: dbPlayer.cha || 1,
                lck: dbPlayer.lck || 3
            },
            x: dbPlayer.x || 7,
            y: dbPlayer.y || 7
        };
    }
    
    // Загрузка состояния мира - ТОЛЬКО SUPABASE
    async loadWorldState() {
        if (!this.isConnected) {
            throw new Error('Supabase не подключен');
        }
        
        const { data: mobs, error } = await this.supabase
            .from('world_mobs')
            .select('*');
            
        if (error) {
            throw new Error(`Ошибка загрузки мира: ${error.message}`);
        }
        
        this.worldState.mobs = mobs || [];
        console.log('✅ Состояние мира загружено:', this.worldState);
    }
    
    // Настройка realtime подписок
    setupRealtimeSubscriptions() {
        if (!this.isConnected) return;
        
        this.supabase
            .channel('world_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'world_mobs'
            }, payload => {
                console.log('🔄 Обновление мобов:', payload);
            })
            .subscribe();
    }
    
    // Получить текущего игрока
    getCurrentPlayer() {
        return this.currentPlayer;
    }
    
    // Получить состояние мира
    getWorldState() {
        return this.worldState;
    }
    
    // Проверка онлайн статуса
    isOnline() {
        return this.isConnected;
    }
    
    // Установить текущего игрока
    setCurrentPlayer(player) {
        this.currentPlayer = player;
    }
    
    // Сохранить игрока
    async savePlayer(player) {
        if (!this.isConnected) {
            throw new Error('Supabase не подключен');
        }
        
        // Подготавливаем данные для обновления
        const updateData = {
            level: player.level || 1,
            experience: player.experience || 0,
            gold: player.gold || 0,
            health: player.health || 70,
            x: player.x || 7,
            y: player.y || 7
        };
        
        // Добавляем характеристики если они есть
        if (player.stats) {
            updateData.str = player.stats.str || 1;
            updateData.end_stat = player.stats.end || 1;
            updateData.dex = player.stats.dex || 1;
            updateData.int = player.stats.int || 1;
            updateData.cha = player.stats.cha || 1;
            updateData.lck = player.stats.lck || 1;
        }
        
        console.log('💾 Обновляем игрока в Supabase:', updateData);
        
        const { data, error } = await this.supabase
            .from('players')
            .update(updateData)
            .eq('id', player.id)
            .select()
            .single();
            
        if (error) {
            console.error('❌ Ошибка обновления БД:', error);
            throw new Error(`Ошибка сохранения: ${error.message}`);
        }
        
        console.log('✅ Игрок сохранен в Supabase:', data);
        return this.convertPlayerFormat(data);
    }
    
    // Движение игрока
    async movePlayer(direction) {
        if (!this.isConnected || !this.currentPlayer) {
            throw new Error('Нет подключения или игрока');
        }
        
        let newX = this.currentPlayer.x;
        let newY = this.currentPlayer.y;
        
        switch (direction) {
            case 'up': newY = Math.max(0, newY - 1); break;
            case 'down': newY = Math.min(14, newY + 1); break;
            case 'left': newX = Math.max(0, newX - 1); break;
            case 'right': newX = Math.min(14, newX + 1); break;
        }
        
        const { error } = await this.supabase
            .from('players')
            .update({ x: newX, y: newY })
            .eq('id', this.currentPlayer.id);
            
        if (error) {
            throw new Error(`Ошибка движения: ${error.message}`);
        }
        
        this.currentPlayer.x = newX;
        this.currentPlayer.y = newY;
        
        return { success: true, mobsEncountered: [] };
    }
    
    // Атака моба
    async attackMob(mobId) {
        if (!this.isConnected || !this.currentPlayer) {
            throw new Error('Нет подключения или игрока');
        }
        
        const mob = this.worldState.mobs.find(m => m.id === mobId);
        if (!mob) {
            throw new Error('Моб не найден');
        }
        
        const damage = Math.floor(Math.random() * 20) + 10;
        const newHp = Math.max(0, mob.current_hp - damage);
        
        const { error } = await this.supabase
            .from('world_mobs')
            .update({ 
                current_hp: newHp,
                is_alive: newHp > 0
            })
            .eq('id', mobId);
            
        if (error) {
            throw new Error(`Ошибка атаки: ${error.message}`);
        }
        
        const log = [`Вы атаковали ${mob.name} на ${damage} урона!`];
        
        if (newHp <= 0) {
            log.push(`${mob.name} повержен!`);
            await this.supabase
                .from('players')
                .update({ 
                    gold: this.currentPlayer.gold + mob.base_gold,
                    experience: this.currentPlayer.experience + 10
                })
                .eq('id', this.currentPlayer.id);
                
            this.currentPlayer.gold += mob.base_gold;
            this.currentPlayer.experience += 10;
        }
        
        return {
            result: newHp <= 0 ? 'victory' : 'continue',
            log: log,
            rewards: newHp <= 0 ? { exp: 10, gold: mob.base_gold } : null
        };
    }
    
    // Отправить сообщение в чат
    async sendChatMessage(message) {
        if (!this.isConnected || !this.currentPlayer) {
            throw new Error('Нет подключения или игрока');
        }
        
        const { error } = await this.supabase
            .from('chat_messages')
            .insert({
                player_id: this.currentPlayer.id,
                message: message.trim(),
                channel: 'global'
            });
            
        if (error) {
            throw new Error(`Ошибка отправки сообщения: ${error.message}`);
        }
        
        return true;
    }
    
    // Получить последние сообщения чата
    async getChatMessages(limit = 20) {
        if (!this.isConnected) {
            throw new Error('Supabase не подключен');
        }
        
        const { data, error } = await this.supabase
            .from('chat_messages')
            .select(`
                id,
                message,
                created_at,
                players!inner(
                    nickname,
                    faction
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) {
            throw new Error(`Ошибка загрузки чата: ${error.message}`);
        }
        
        return data.reverse(); // Последние сообщения внизу
    }
    
    // Получить рейтинг игроков
    async getPlayersRanking(limit = 10) {
        if (!this.isConnected) {
            throw new Error('Supabase не подключен');
        }
        
        const { data, error } = await this.supabase
            .from('players')
            .select('nickname, faction, level, str, end_stat, dex, int, cha, lck')
            .order('level', { ascending: false })
            .limit(limit);
            
        if (error) {
            throw new Error(`Ошибка загрузки рейтинга: ${error.message}`);
        }
        
        // Добавляем общую сумму статов
        return data.map(player => ({
            ...player,
            totalStats: (player.str || 0) + (player.end_stat || 0) + (player.dex || 0) + 
                       (player.int || 0) + (player.cha || 0) + (player.lck || 0)
        })).sort((a, b) => b.totalStats - a.totalStats);
    }
    
    // Выход из системы
    async logout() {
        if (this.currentPlayer) {
            await this.supabase
                .from('players')
                .update({ is_online: false })
                .eq('id', this.currentPlayer.id);
        }
        
        this.currentPlayer = null;
    }
}

// Глобальная инициализация
window.supabaseClient = new SupabaseGameClient();

// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Инициализируем Supabase клиент...');
    
    try {
        await window.supabaseClient.initialize();
        console.log('🌐 Работаем в ОНЛАЙН режиме');
        await window.supabaseClient.loadWorldState();
    } catch (error) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
        alert('Ошибка подключения к серверу: ' + error.message);
    }
});
