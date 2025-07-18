/**
 * Дебаг функции для тестирования Supabase интеграции
 * Откройте консоль браузера (F12) и используйте эти команды
 */

// 🔍 Проверка состояния подключения
window.checkSupabaseConnection = async () => {
    console.log('=== ПРОВЕРКА SUPABASE ПОДКЛЮЧЕНИЯ ===');
    
    if (!window.supabaseClient) {
        console.error('❌ supabaseClient не найден');
        return;
    }
    
    console.log('📊 Статус подключения:', window.supabaseClient.isConnected);
    console.log('👤 Текущая сессия:', window.supabaseClient.currentSession);
    console.log('🌍 Состояние мира:', window.supabaseClient.worldState);
    
    if (window.supabaseClient.isConnected) {
        try {
            // Тестируем запрос к БД
            const { data, error } = await window.supabaseClient.supabase
                .from('players')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('❌ Ошибка запроса к БД:', error);
            } else {
                console.log('✅ Подключение к БД работает');
                
                // Показываем статистику
                await window.debugSupabaseStats();
            }
        } catch (error) {
            console.error('❌ Ошибка тестирования БД:', error);
        }
    }
};

// 📊 Статистика базы данных
window.debugSupabaseStats = async () => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    console.log('=== СТАТИСТИКА БАЗЫ ДАННЫХ ===');
    
    try {
        // Количество игроков
        const { data: players, error: playersError } = await window.supabaseClient.supabase
            .from('players')
            .select('id, nickname, faction, is_online')
            .order('created_at', { ascending: false });
            
        if (!playersError) {
            console.log(`👥 Всего игроков: ${players.length}`);
            console.log(`🟢 Онлайн: ${players.filter(p => p.is_online).length}`);
            console.log(`⚙️ Работяги: ${players.filter(p => p.faction === 'workers').length}`);
            console.log(`🎨 Креаклы: ${players.filter(p => p.faction === 'creatives').length}`);
            console.log('📋 Список игроков:', players);
        }
        
        // Количество мобов
        const { data: mobs, error: mobsError } = await window.supabaseClient.supabase
            .from('world_mobs')
            .select('id, name, x, y, is_alive');
            
        if (!mobsError) {
            console.log(`👹 Всего мобов: ${mobs.length}`);
            console.log(`💀 Живых: ${mobs.filter(m => m.is_alive).length}`);
            console.log('🗺️ Мобы на карте:', mobs);
        }
        
        // Последние сообщения чата
        const { data: messages, error: messagesError } = await window.supabaseClient.supabase
            .from('chat_messages')
            .select(`
                message, created_at,
                players:player_id (nickname, faction)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (!messagesError) {
            console.log(`💬 Сообщений в чате: ${messages.length}`);
            console.log('📝 Последние сообщения:', messages);
        }
        
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
    }
};

// 🗺️ Показать карту мира
window.debugWorldMap = async () => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    console.log('=== КАРТА МИРА 15x15 ===');
    
    try {
        // Получаем всех игроков
        const { data: players } = await window.supabaseClient.supabase
            .from('players')
            .select('nickname, x, y, faction, is_online');
            
        // Получаем всех мобов
        const { data: mobs } = await window.supabaseClient.supabase
            .from('world_mobs')
            .select('name, x, y, is_alive');
        
        // Строим карту
        let map = '';
        for (let y = 0; y < 15; y++) {
            let row = '';
            for (let x = 0; x < 15; x++) {
                const player = players?.find(p => p.x === x && p.y === y && p.is_online);
                const mob = mobs?.find(m => m.x === x && m.y === y && m.is_alive);
                
                if (player) {
                    row += player.faction === 'workers' ? '⚙️' : '🎨';
                } else if (mob) {
                    row += '👹';
                } else {
                    row += '⬜';
                }
            }
            map += row + '\n';
        }
        
        console.log(map);
        console.log('Легенда: ⚙️ Работяги | 🎨 Креаклы | 👹 Мобы | ⬜ Пусто');
        
    } catch (error) {
        console.error('❌ Ошибка построения карты:', error);
    }
};

// 🧪 Тест регистрации
window.testSupabaseRegistration = async (nickname = 'TestUser', faction = 'workers') => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    console.log('=== ТЕСТ РЕГИСТРАЦИИ ===');
    
    try {
        const testData = {
            nickname: nickname + '_' + Date.now(),
            faction: faction,
            gender: 'male'
        };
        
        const password = 'test123';
        
        console.log('📝 Регистрируем тестового пользователя:', testData);
        
        const newUser = await window.supabaseClient.registerPlayer(testData, password);
        console.log('✅ Пользователь создан:', newUser);
        
        return newUser;
    } catch (error) {
        console.error('❌ Ошибка тестовой регистрации:', error);
    }
};

// 🔐 Тест авторизации
window.testSupabaseLogin = async (nickname, password = 'test123') => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    console.log('=== ТЕСТ АВТОРИЗАЦИИ ===');
    
    try {
        console.log('🔑 Авторизуемся как:', nickname);
        
        const user = await window.supabaseClient.loginPlayer(nickname, password);
        console.log('✅ Авторизация успешна:', user);
        
        return user;
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error);
    }
};

// 💬 Тест чата
window.testSupabaseChat = async (message = 'Тестовое сообщение') => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    if (!window.supabaseClient.currentSession) {
        console.log('❌ Нет активной сессии. Сначала авторизуйтесь.');
        return;
    }
    
    console.log('=== ТЕСТ ЧАТА ===');
    
    try {
        console.log('📝 Отправляем сообщение:', message);
        
        const result = await window.supabaseClient.sendChatMessage(message);
        console.log('✅ Сообщение отправлено:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
    }
};

// 🏃 Тест движения
window.testSupabaseMovement = async (direction = 'up') => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    if (!window.supabaseClient.currentSession) {
        console.log('❌ Нет активной сессии. Сначала авторизуйтесь.');
        return;
    }
    
    console.log('=== ТЕСТ ДВИЖЕНИЯ ===');
    
    try {
        console.log('🏃 Двигаемся:', direction);
        console.log('Текущая позиция:', {
            x: window.supabaseClient.currentSession.x,
            y: window.supabaseClient.currentSession.y
        });
        
        const result = await window.supabaseClient.movePlayer(direction);
        console.log('✅ Результат движения:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Ошибка движения:', error);
    }
};

// 🔥 Очистка тестовых данных
window.cleanupTestData = async () => {
    if (!window.supabaseClient?.isConnected) {
        console.log('❌ Нет подключения к Supabase');
        return;
    }
    
    console.log('=== ОЧИСТКА ТЕСТОВЫХ ДАННЫХ ===');
    
    try {
        // Удаляем тестовых пользователей
        const { data, error } = await window.supabaseClient.supabase
            .from('players')
            .delete()
            .like('nickname', 'TestUser_%');
            
        if (error) {
            console.error('❌ Ошибка очистки:', error);
        } else {
            console.log('✅ Тестовые данные очищены');
        }
    } catch (error) {
        console.error('❌ Ошибка очистки:', error);
    }
};

// 📋 Показать все доступные команды
window.showSupabaseCommands = () => {
    console.log('=== ДОСТУПНЫЕ КОМАНДЫ ДЕБАГА ===');
    console.log('🔍 checkSupabaseConnection() - проверить подключение');
    console.log('📊 debugSupabaseStats() - статистика БД');
    console.log('🗺️ debugWorldMap() - показать карту мира');
    console.log('🧪 testSupabaseRegistration("nickname", "faction") - тест регистрации');
    console.log('🔐 testSupabaseLogin("nickname", "password") - тест авторизации');
    console.log('💬 testSupabaseChat("сообщение") - тест чата');
    console.log('🏃 testSupabaseMovement("up/down/left/right") - тест движения');
    console.log('🔥 cleanupTestData() - очистить тестовые данные');
    console.log('📋 showSupabaseCommands() - показать эту справку');
};

// Автоматически показываем команды при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🚀 Supabase дебаг команды загружены!');
        console.log('Введите showSupabaseCommands() для просмотра доступных команд');
    }, 3000);
});

// Экспортируем функции глобально
window.supabaseDebug = {
    checkConnection: window.checkSupabaseConnection,
    showStats: window.debugSupabaseStats,
    showMap: window.debugWorldMap,
    testRegister: window.testSupabaseRegistration,
    testLogin: window.testSupabaseLogin,
    testChat: window.testSupabaseChat,
    testMove: window.testSupabaseMovement,
    cleanup: window.cleanupTestData,
    help: window.showSupabaseCommands
};
