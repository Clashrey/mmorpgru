// js/supabase-client.js - Обновленный клиент с исправлениями
class SupabaseGameClient {
    constructor() {
        // Замени на свои данные из Supabase проекта
        this.supabaseUrl = 'YOUR_SUPABASE_URL'; // например: https://xxxxx.supabase.co
        this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Public anon key
        this.supabase = null;
        this.currentSession = null;
        this.realtimeChannel = null;
        
        this.worldState = {
            players: [],
            mobs: [],
            chatMessages: []
        };
        
        this.isConnected = false;
    }
    
    // Инициализация Supabase
    async initialize() {
        try {
            // Проверяем, доступен ли Supabase SDK
            if (typeof window.supabase === 'undefined') {
                console.error('Supabase SDK не загружен. Добавьте в HTML: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
                return false;
            }
            
            // Создаем клиент Supabase
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            
            // Проверяем соединение
            const { data, error } = await this.supabase.from('players').select('count').limit(1);
            if (error) {
                throw error;
            }
            
            console.log('✅ Supabase подключен успешно!');
            this.isConnected = true;
            
            // Запускаем realtime подписки
            this.setupRealtimeSubscriptions();
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка подключения к Supabase:', error);
            console.log('🔄 Работаем в оффлайн режиме');
            return false;
        }
    }
    
    // Настройка realtime подписок
    setupRealtimeSubscriptions() {
        // Подписка на изменения игроков
        this.realtimeChannel = this.supabase
            .channel('game-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'players'
            }, (payload) => {
                this.handlePlayerUpdate(payload);
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages'
            }, (payload) => {
                this.handleChatMessage(payload.new);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'world_mobs'
            }, (payload) => {
                this.handleMobUpdate(payload);
            })
            .subscribe();
    }
    
    // Регистрация нового игрока
    async registerPlayer(playerData, password) {
        try {
            // Хешируем пароль (простое хеширование)
            const passwordHash = this.hashPassword(password);
            
            // Устанавливаем стартовые характеристики по фракции
            const stats = this.getFactionStats(playerData.faction);
            
            const { data, error } = await this.supabase
                .from('players')
                .insert([{
                    nickname: playerData.nickname,
                    password_hash: passwordHash,
                    faction: playerData.faction,
                    gender: playerData.gender,
                    ...stats
                }])
                .select()
                .single();
                
            if (error) {
                if (error.code === '23505') { // unique constraint violation
                    throw new Error('Пользователь с таким никнеймом уже существует');
                }
                throw error;
            }
            
            console.log('✅ Игрок зарегистрирован:', data);
            return data;
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            throw error;
        }
    }
    
    // Авторизация игрока
    async loginPlayer(nickname, password) {
        try {
            const passwordHash = this.hashPassword(password);
            
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('nickname', nickname)
                .eq('password_hash', passwordHash)
                .single();
                
            if (error || !data) {
                throw new Error('Неверный никнейм или пароль');
            }
            
            // Обновляем статус онлайн и время входа
            await this.supabase
                .from('players')
                .update({
                    is_online: true,
                    last_login: new Date().toISOString(),
                    last_activity: new Date().toISOString()
                })
                .eq('id', data.id);
            
            this.currentSession = data;
            console.log('✅ Успешная авторизация:', data.nickname);
            
            // Загружаем состояние мира
            await this.loadWorldState();
            
            return data;
        } catch (error) {
            console.error('❌ Ошибка авторизации:', error);
            throw error;
        }
    }
    
    // Загрузка состояния мира
    async loadWorldState() {
        try {
            // Загружаем онлайн игроков
            const { data: players, error: playersError } = await this.supabase
                .from('player_full_info')
                .select('*')
                .eq('is_online', true)
                .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // активные за последние 5 минут
                
            if (playersError) throw playersError;
            
            // Загружаем активных мобов
            const { data: mobs, error: mobsError } = await this.supabase
                .from('active_world_mobs')
                .select('*');
                
            if (mobsError) throw mobsError;
            
            // Загружаем последние сообщения чата
            const { data: chatMessages, error: chatError } = await this.supabase
                .from('chat_messages')
                .select(`
                    *,
                    players:player_id (nickname, faction)
                `)
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (chatError) throw chatError;
            
            this.worldState = {
                players: players || [],
                mobs: mobs || [],
                chatMessages: (chatMessages || []).reverse()
            };
            
            console.log('✅ Состояние мира загружено:', this.worldState);
            return this.worldState;
        } catch (error) {
            console.error('❌ Ошибка загрузки состояния мира:', error);
            throw error;
        }
    }
    
    // Движение игрока
    async movePlayer(direction) {
        if (!this.currentSession) return false;
        
        try {
            let newX = this.currentSession.x;
            let newY = this.currentSession.y;
            
            switch (direction) {
                case 'up': newY = Math.max(0, newY - 1); break;
                case 'down': newY = Math.min(14, newY + 1); break;
                case 'left': newX = Math.max(0, newX - 1); break;
                case 'right': newX = Math.min(14, newX + 1); break;
            }
            
            const { data, error } = await this.supabase
                .from('players')
                .update({ x: newX, y: newY })
                .eq('id', this.currentSession.id)
                .select()
                .single();
                
            if (error) throw error;
            
            this.currentSession.x = newX;
            this.currentSession.y = newY;
            
            // Проверяем столкновения с мобами
            const mobsAtPosition = this.worldState.mobs.filter(
                mob => mob.x === newX && mob.y === newY && mob.is_alive
            );
            
            return {
                success: true,
                newPosition: { x: newX, y: newY },
                mobsEncountered: mobsAtPosition
            };
        } catch (error) {
            console.error('❌ Ошибка движения:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Атака моба
    async attackMob(mobId) {
        if (!this.currentSession) return false;
        
        try {
            // Получаем данные моба
            const { data: mob, error: mobError } = await this.supabase
                .from('active_world_mobs')
                .select('*')
                .eq('id', mobId)
                .single();
                
            if (mobError || !mob) {
                throw new Error('Моб не найден');
            }
            
            // Проверяем дистанцию
            const distance = Math.abs(this.currentSession.x - mob.x) + Math.abs(this.currentSession.y - mob.y);
            if (distance > 1) {
                throw new Error('Слишком далеко от моба');
            }
            
            // Симулируем бой
            const battleResult = await this.simulateBattle(this.currentSession, mob);
            
            // Сохраняем результат боя в БД
            await this.saveBattleResult(battleResult, mob);
            
            return battleResult;
        } catch (error) {
            console.error('❌ Ошибка атаки моба:', error);
            throw error;
        }
    }
    
    // Симуляция боя
    async simulateBattle(player, mob) {
        const playerStats = {
            hp: 50 + (player.end_stat || player.end || 1) * 10, // учитываем оба варианта названия
            attack: 10 + (player.str || 1) * 3,
            defense: (player.end_stat || player.end || 1) * 2,
            dodgeChance: (player.dex || 1) * 1.5 + (player.int || 1) * 2 + (player.lck || 1) * 1
        };
        
        let playerHp = playerStats.hp;
        let mobHp = mob.current_hp;
        let totalDamageDealt = 0;
        let totalDamageTaken = 0;
        
        const log = [];
        
        // Простой бой: по очереди бьем друг друга
        while (playerHp > 0 && mobHp > 0) {
            // Ход игрока
            const playerDamage = Math.max(1, playerStats.attack - mob.base_defense);
            mobHp -= playerDamage;
            totalDamageDealt += playerDamage;
            log.push(`Вы нанесли ${playerDamage} урона мобу ${mob.name}`);
            
            if (mobHp <= 0) break;
            
            // Ход моба
            const mobDamage = Math.max(1, mob.base_attack - playerStats.defense);
            playerHp -= mobDamage;
            totalDamageTaken += mobDamage;
            log.push(`${mob.name} нанес вам ${mobDamage} урона`);
        }
        
        const playerWon = playerHp > 0;
        const rewards = playerWon ? {
            exp: 10 + Math.floor(Math.random() * 10),
            gold: mob.base_gold
        } : { exp: 0, gold: 0 };
        
        return {
            result: playerWon ? 'victory' : 'defeat',
            log: log,
            rewards: rewards,
            damageDealt: totalDamageDealt,
            damageTaken: totalDamageTaken,
            playerHp: Math.max(0, playerHp),
            mobHp: Math.max(0, mobHp)
        };
    }
    
    // Сохранение результата боя
    async saveBattleResult(battleResult, mob) {
        try {
            // Обновляем моба (убиваем если побежден)
            if (battleResult.result === 'victory') {
                await this.supabase
                    .from('world_mobs')
                    .update({
                        current_hp: 0,
                        is_alive: false,
                        last_damage_at: new Date().toISOString()
                    })
                    .eq('id', mob.id);
            }
            
            // Обновляем игрока
            if (battleResult.result === 'victory') {
                const newExp = this.currentSession.experience + battleResult.rewards.exp;
                const newGold = this.currentSession.gold + battleResult.rewards.gold;
                let newLevel = this.currentSession.level;
                
                // Проверяем повышение уровня
                const requiredExp = newLevel * 100;
                if (newExp >= requiredExp) {
                    newLevel += 1;
                    // При повышении уровня увеличиваем все статы на 1
                    const updateData = {
                        level: newLevel,
                        experience: 0,
                        gold: newGold + 50, // бонус за уровень
                        str: this.currentSession.str + 1,
                        end_stat: (this.currentSession.end_stat || this.currentSession.end) + 1,
                        dex: this.currentSession.dex + 1,
                        int: this.currentSession.int + 1,
                        cha: this.currentSession.cha + 1,
                        lck: this.currentSession.lck + 1
                    };
                    
                    await this.supabase
                        .from('players')
                        .update(updateData)
                        .eq('id', this.currentSession.id);
                        
                    // Обновляем локальную сессию
                    Object.assign(this.currentSession, updateData);
                    
                    battleResult.levelUp = true;
                    battleResult.newLevel = newLevel;
                } else {
                    await this.supabase
                        .from('players')
                        .update({
                            experience: newExp,
                            gold: newGold
                        })
                        .eq('id', this.currentSession.id);
                        
                    this.currentSession.experience = newExp;
                    this.currentSession.gold = newGold;
                }
            }
            
            // Сохраняем запись о бое
            await this.supabase
                .from('battles')
                .insert([{
                    player_id: this.currentSession.id,
                    opponent_type: 'mob',
                    opponent_id: mob.id,
                    status: 'finished',
                    winner: battleResult.result === 'victory' ? 'player' : 'opponent',
                    player_damage_dealt: battleResult.damageDealt,
                    player_damage_taken: battleResult.damageTaken,
                    exp_gained: battleResult.rewards.exp,
                    gold_gained: battleResult.rewards.gold,
                    finished_at: new Date().toISOString()
                }]);
            
            // Обновляем статистику
            await this.supabase.rpc('update_player_stats', {
                p_player_id: this.currentSession.id,
                p_battle_won: battleResult.result === 'victory',
                p_damage_dealt: battleResult.damageDealt,
                p_damage_taken: battleResult.damageTaken,
                p_gold_earned: battleResult.rewards.gold
            });
            
        } catch (error) {
            console.error('❌ Ошибка сохранения результата боя:', error);
        }
    }
    
    // Отправка сообщения в чат
    async sendChatMessage(message) {
        if (!this.currentSession || !message.trim()) return false;
        
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert([{
                    player_id: this.currentSession.id,
                    message: message.trim(),
                    channel: 'global'
                }])
                .select(`
                    *,
                    players:player_id (nickname, faction)
                `)
                .single();
                
            if (error) throw error;
            
            // Обновляем статистику сообщений
            await this.supabase.rpc('update_player_stats', {
                p_player_id: this.currentSession.id,
                p_messages_sent: 1
            });
            
            return data;
        } catch (error) {
            console.error('❌ Ошибка отправки сообщения:', error);
            throw error;
        }
    }
    
    // Тренировка характеристики
    async trainStat(statName, cost) {
        if (!this.currentSession) return false;
        
        try {
            if (this.currentSession.gold < cost) {
                throw new Error('Недостаточно золота');
            }
            
            // Преобразуем end в end_stat для базы данных
            const dbStatName = statName === 'end' ? 'end_stat' : statName;
            
            const updateData = {
                gold: this.currentSession.gold - cost
            };
            updateData[dbStatName] = (this.currentSession[statName] || this.currentSession[dbStatName]) + 1;
            
            const { data, error } = await this.supabase
                .from('players')
                .update(updateData)
                .eq('id', this.currentSession.id)
                .select()
                .single();
                
            if (error) throw error;
            
            // Обновляем локальную сессию
            this.currentSession.gold -= cost;
            this.currentSession[statName] = (this.currentSession[statName] || this.currentSession[dbStatName]) + 1;
            if (dbStatName !== statName) {
                this.currentSession[dbStatName] = this.currentSession[statName];
            }
            
            // Обновляем статистику
            await this.supabase.rpc('update_player_stats', {
                p_player_id: this.currentSession.id,
                p_gold_spent: cost
            });
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка тренировки:', error);
            throw error;
        }
    }
    
    // Выход из игры
    async logout() {
        if (!this.currentSession) return;
        
        try {
            // Обновляем статус оффлайн
            await this.supabase
                .from('players')
                .update({ is_online: false })
                .eq('id', this.currentSession.id);
                
            // Отписываемся от realtime
            if (this.realtimeChannel) {
                this.supabase.removeChannel(this.realtimeChannel);
                this.realtimeChannel = null;
            }
            
            this.currentSession = null;
            console.log('✅ Выход выполнен');
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
        }
    }
    
    // Обработчики realtime событий
    handlePlayerUpdate(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'UPDATE' && newRecord) {
            // Обновляем игрока в списке
            const index = this.worldState.players.findIndex(p => p.id === newRecord.id);
            if (index !== -1) {
                this.worldState.players[index] = newRecord;
            }
            
            // Уведомляем интерфейс об обновлении
            this.notifyWorldUpdate('player_moved', newRecord);
        }
    }
    
    handleChatMessage(message) {
        // Добавляем сообщение в локальный список
        this.worldState.chatMessages.push(message);
        
        // Ограничиваем количество сообщений
        if (this.worldState.chatMessages.length > 100) {
            this.worldState.chatMessages.shift();
        }
        
        // Уведомляем интерфейс
        this.notifyWorldUpdate('chat_message', message);
    }
    
    handleMobUpdate(payload) {
        const { eventType, new: newRecord } = payload;
        
        if (eventType === 'UPDATE' && newRecord) {
            const index = this.worldState.mobs.findIndex(m => m.id === newRecord.id);
            if (index !== -1) {
                this.worldState.mobs[index] = newRecord;
            }
            
            this.notifyWorldUpdate('mob_updated', newRecord);
        }
    }
    
    // Уведомление интерфейса об изменениях
    notifyWorldUpdate(eventType, data) {
        const event = new CustomEvent('worldUpdate', {
            detail: { type: eventType, data: data }
        });
        window.dispatchEvent(event);
    }
    
    // Вспомогательные функции
    hashPassword(password) {
        // Простое хеширование (в продакшене использовать bcrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    getFactionStats(faction) {
        if (faction === 'workers') {
            return { str: 5, end_stat: 5, dex: 3, int: 1, cha: 1, lck: 3 };
        } else {
            return { str: 2, end_stat: 2, dex: 2, int: 5, cha: 5, lck: 2 };
        }
    }
    
    // Получить текущего игрока
    getCurrentPlayer() {
        return this.currentSession;
    }
    
    // Получить состояние мира
    getWorldState() {
        return this.worldState;
    }
    
    // Проверка подключения
    isOnline() {
        return this.isConnected && this.currentSession !== null;
    }
}

// Создаем глобальный экземпляр
if (!window.supabaseClient) {
    window.supabaseClient = new SupabaseGameClient();
}
