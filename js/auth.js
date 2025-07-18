/**
 * Система авторизации ТОЛЬКО через Supabase (БЕЗ localStorage)
 */
class AuthSystem {
    constructor() {
        this.currentUser = null; // Только в памяти!
        this.initializeEventListeners();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Форма входа
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
        });
    }
    
    /**
     * Обработка входа
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const nickname = formData.get('nickname').trim();
        const password = formData.get('password');
        
        console.log('🔐 Попытка входа через Supabase:', nickname);
        
        try {
            // Используем ТОЛЬКО Supabase
            const user = await window.supabaseClient.loginPlayer(nickname, password);
            
            if (user) {
                this.setCurrentUser(user);
                
                // Сохраняем данные для автологина
                localStorage.setItem('mmo_auto_login', JSON.stringify({
                    nickname: nickname,
                    password: password
                }));
                
                console.log('✅ Успешный вход:', user);
                window.gameApp.showScreen('game-screen');
                this.displayPlayerInfo(user);
            }
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            alert(`Ошибка входа: ${error.message}`);
        }
    }
    
    /**
     * Создание нового пользователя ТОЛЬКО через Supabase
     */
    async createUser(characterData, password) {
        try {
            console.log('🎮 Создаем пользователя через Supabase:', characterData);
            
            const newUser = await window.supabaseClient.registerPlayer(characterData, password);
            
            console.log('✅ Пользователь создан:', newUser);
            return newUser;
        } catch (error) {
            console.error('❌ Ошибка создания пользователя:', error);
            throw error;
        }
    }
    
    /**
     * Проверка существования пользователя (заглушка - проверка в Supabase)
     */
    userExists(nickname) {
        // Проверка будет в Supabase при регистрации
        return false;
    }
    
    /**
     * Аутентификация пользователя ТОЛЬКО через Supabase
     */
    async authenticateUser(nickname, password) {
        try {
            return await window.supabaseClient.loginPlayer(nickname, password);
        } catch (error) {
            console.error('❌ Ошибка аутентификации:', error);
            return null;
        }
    }
    
    /**
     * Установить текущего пользователя (ТОЛЬКО в памяти)
     */
    setCurrentUser(user) {
        this.currentUser = user;
        window.supabaseClient.setCurrentPlayer(user);
        console.log('👤 Текущий пользователь установлен:', user.nickname);
    }
    
    /**
     * Получить текущего пользователя (ТОЛЬКО из памяти)
     */
    getCurrentUser() {
        return this.currentUser || window.supabaseClient.getCurrentPlayer();
    }
    
    /**
     * Выход из системы
     */
    logout() {
        // Очищаем данные автологина
        localStorage.removeItem('mmo_auto_login');
        
        this.currentUser = null;
        window.supabaseClient.logout();
        window.gameApp.showScreen('loading-screen');
        console.log('🚺 Выход из системы');
    }
    
    /**
     * Выход из системы
     */
    logout() {
        this.currentUser = null;
        window.supabaseClient.logout();
        window.gameApp.showScreen('loading-screen');
        console.log('🚪 Выход из системы');
    }
    
    /**
     * Получить всех пользователей (заглушка - в Supabase это не нужно)
     */
    async getUsers() {
        // Заглушка - возвращаем пустой массив
        return [];
    }
    
    /**
     * Сохранить пользователей (заглушка - в Supabase не нужно)
     */
    async saveUsers(users) {
        // Заглушка - ничего не делаем
        console.log('💾 saveUsers() вызван, но игнорируется (используется Supabase)');
    }
    
    /**
     * Сохранить изменения текущего пользователя
     */
    async saveCurrentUser() {
        if (!this.currentUser) {
            console.warn('⚠️ Нет текущего пользователя для сохранения');
            return false;
        }
        
        try {
            console.log('💾 Сохраняем пользователя в Supabase:', this.currentUser);
            const updatedUser = await window.supabaseClient.savePlayer(this.currentUser);
            this.currentUser = updatedUser;
            this.displayPlayerInfo(updatedUser);
            console.log('✅ Пользователь сохранен в Supabase');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователя:', error);
            alert('Ошибка сохранения данных на сервере');
            return false;
        }
    }
    
    /**
     * Показать информацию об игроке
     */
    displayPlayerInfo(user) {
        try {
            console.log('🎭 Отображаем информацию игрока:', user);
            
            // Заполняем основные характеристики
            if (user.stats) {
                const statElements = {
                    'game-stat-str': user.stats.str || 1,
                    'game-stat-int': user.stats.int || 1,
                    'game-stat-cha': user.stats.cha || 1,
                    'game-stat-end': user.stats.end || 1,
                    'game-stat-dex': user.stats.dex || 1,
                    'game-stat-lck': user.stats.lck || 1
                };
                
                for (const [id, value] of Object.entries(statElements)) {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                    }
                }
            }
            
            // Заполняем информацию
            const infoElements = {
                'character-display-name': user.nickname || 'Игрок',
                'game-level': user.level || 1,
                'game-experience': user.experience || 0,
                'game-gold': user.gold || 100
            };
            
            for (const [id, value] of Object.entries(infoElements)) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            }
            
            // Рассчитываем HP: 50 + END * 10
            const calculatedHP = user.stats ? (50 + user.stats.end * 10) : (user.health || 105);
            const healthElement = document.getElementById('game-health');
            if (healthElement) {
                healthElement.textContent = calculatedHP;
            }
            
            // Фракция
            const factionBadge = document.getElementById('character-faction-badge');
            if (factionBadge && user.faction) {
                const factionName = user.faction === 'workers' ? 'Работяги' : 'Креаклы';
                factionBadge.textContent = factionName;
            }
            
            console.log('✅ Информация игрока отображена');
        } catch (error) {
            console.error('❌ Ошибка отображения информации игрока:', error);
        }
    }
    
    /**
     * Завершить создание персонажа
     */
    completeCharacterCreation() {
        console.log('⚠️ Устаревший метод - используйте прямую регистрацию через Supabase');
        return false;
    }
    
    /**
     * Показать ошибку
     */
    showError(message) {
        alert(message);
    }
}

// Создаем глобальный экземпляр системы авторизации только если его еще нет
if (!window.authSystem) {
    window.authSystem = new AuthSystem();
    console.log('🔐 AuthSystem создан (ТОЛЬКО Supabase)');
}