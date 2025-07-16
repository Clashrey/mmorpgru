/**
 * Класс для управления авторизацией и регистрацией с новой системой характеристик
 */
class AuthSystem {
    constructor() {
        this.storageKey = 'mmo_rpg_users';
        this.currentUserKey = 'mmo_rpg_current_user';
        this.initializeEventListeners();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Форма регистрации
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            }
            
            // Форма входа
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
            
            // Проверка паролей в реальном времени
            const passwordRepeat = document.getElementById('password-repeat');
            if (passwordRepeat) {
                passwordRepeat.addEventListener('input', () => this.validatePasswordMatch());
            }
            
            // Проверка никнейма в реальном времени
            const nickname = document.getElementById('nickname');
            if (nickname) {
                nickname.addEventListener('input', () => this.validateNickname());
            }
        });
    }
    
    /**
     * Обработка регистрации
     */
    handleRegister(e) {
        e.preventDefault();
        console.log('handleRegister вызвана, но логика перенесена в app.js');
    }
    
    /**
     * Обработка входа
     */
    handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const nickname = formData.get('nickname').trim();
        const password = formData.get('password');
        
        console.log('Попытка входа:', { nickname, password });
        console.log('Сохраненные пользователи:', this.getUsers());
        
        const user = this.authenticateUser(nickname, password);
        console.log('Результат аутентификации:', user);
        
        if (user) {
            this.setCurrentUser(user);
            console.log('Пользователь установлен, переходим в игру');
            window.gameApp.showScreen('game-screen');
            this.displayPlayerInfo(user);
        } else {
            console.log('Неверный никнейм или пароль');
        }
    }
    
    /**
     * Валидация данных регистрации
     */
    validateRegistration(nickname, password, passwordRepeat, faction, gender) {
        if (nickname.length < 3 || nickname.length > 20) {
            return { isValid: false, message: 'Никнейм должен содержать от 3 до 20 символов' };
        }
        
        if (!/^[a-zA-Zа-яА-Я0-9_-]+$/.test(nickname)) {
            return { isValid: false, message: 'Никнейм может содержать только буквы, цифры, _ и -' };
        }
        
        if (password.length < 6) {
            return { isValid: false, message: 'Пароль должен содержать минимум 6 символов' };
        }
        
        if (password !== passwordRepeat) {
            return { isValid: false, message: 'Пароли не совпадают' };
        }
        
        if (!faction) {
            return { isValid: false, message: 'Выберите фракцию' };
        }
        
        if (!gender) {
            return { isValid: false, message: 'Выберите пол персонажа' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Проверка совпадения паролей
     */
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const passwordRepeat = document.getElementById('password-repeat').value;
        const repeatInput = document.getElementById('password-repeat');
        
        if (passwordRepeat && password !== passwordRepeat) {
            repeatInput.style.borderColor = '#ff6b6b';
        } else {
            repeatInput.style.borderColor = '#444';
        }
    }
    
    /**
     * Проверка никнейма
     */
    validateNickname() {
        const nickname = document.getElementById('nickname').value.trim();
        const nicknameInput = document.getElementById('nickname');
        
        if (nickname.length > 0 && !/^[a-zA-Zа-яА-Я0-9_-]+$/.test(nickname)) {
            nicknameInput.style.borderColor = '#ff6b6b';
        } else {
            nicknameInput.style.borderColor = '#444';
        }
    }
    
    /**
     * Проверка существования пользователя
     */
    userExists(nickname) {
        const users = this.getUsers();
        return users.some(user => user.nickname.toLowerCase() === nickname.toLowerCase());
    }
    
    /**
     * Простое хеширование пароля
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    /**
     * Аутентификация пользователя
     */
    authenticateUser(nickname, password) {
        const users = this.getUsers();
        const hashedPassword = this.hashPassword(password);
        console.log('Поиск пользователя:', { nickname, password, hashedPassword });
        
        const user = users.find(user => 
            user.nickname.toLowerCase() === nickname.toLowerCase() && 
            user.password === hashedPassword
        );
        
        console.log('Найденный пользователь:', user);
        return user;
    }
    
    /**
     * Создание нового пользователя с новой системой характеристик
     */
    createUser(characterData, password) {
        const users = this.getUsers();
        const hashedPassword = this.hashPassword(password);
        
        // Создаем персонажа с правильными стартовыми характеристиками
        const character = new Character();
        character.setCharacterInfo(characterData.nickname, characterData.faction, characterData.gender);
        
        const newUser = {
            ...character.getCharacterData(),
            password: hashedPassword,
            id: this.generateUserId()
        };
        
        console.log('Создаем пользователя с новой системой характеристик:', newUser);
        
        users.push(newUser);
        this.saveUsers(users);
        
        return newUser;
    }
    
    /**
     * Получить всех пользователей из localStorage
     */
    getUsers() {
        const users = localStorage.getItem(this.storageKey);
        return users ? JSON.parse(users) : [];
    }
    
    /**
     * Сохранить пользователей в localStorage
     */
    saveUsers(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }
    
    /**
     * Установить текущего пользователя
     */
    setCurrentUser(user) {
        localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    }
    
    /**
     * Получить текущего пользователя
     */
    getCurrentUser() {
        const user = localStorage.getItem(this.currentUserKey);
        return user ? JSON.parse(user) : null;
    }
    
    /**
     * Выход из системы
     */
    logout() {
        localStorage.removeItem(this.currentUserKey);
        window.gameApp.showScreen('loading-screen');
    }
    
    /**
     * Генерация уникального ID пользователя
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Показать ошибку
     */
    showError(message) {
        alert(message);
    }
    
    /**
     * Показать информацию об игроке с новой системой характеристик
     */
    displayPlayerInfo(user) {
        // Заполняем основные характеристики
        if (user.stats) {
            document.getElementById('game-stat-str').textContent = user.stats.str || 1;
            document.getElementById('game-stat-int').textContent = user.stats.int || 1;
            document.getElementById('game-stat-cha').textContent = user.stats.cha || 1;
            document.getElementById('game-stat-end').textContent = user.stats.end || 1;
            document.getElementById('game-stat-dex').textContent = user.stats.dex || 1;
            document.getElementById('game-stat-lck').textContent = user.stats.lck || 1;
        }
        
        // Заполняем информацию
        document.getElementById('character-display-name').textContent = user.nickname || 'Игрок';
        document.getElementById('game-level').textContent = user.level || 1;
        document.getElementById('game-experience').textContent = user.experience || 0;
        
        // Рассчитываем HP по новой формуле: 50 + END * 10
        const calculatedHP = user.stats ? (50 + user.stats.end * 10) : (user.health || 105);
        document.getElementById('game-health').textContent = calculatedHP;
        
        // Убираем ману из отображения (мана больше не используется)
        const manaElement = document.getElementById('game-mana');
        if (manaElement) {
            manaElement.textContent = '-';
        }
        
        document.getElementById('game-gold').textContent = user.gold || 100;
        
        // Отображаем фракцию
        const factionName = user.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('character-faction-badge').textContent = factionName;
        
        console.log('Отображена информация о персонаже с новой системой характеристик');
        console.log('Рассчитанное HP:', calculatedHP);
    }
    
    /**
     * Завершить создание персонажа
     */
    completeCharacterCreation() {
        const tempData = window.tempRegistrationData;
        
        if (!tempData) {
            this.showError('Ошибка: данные регистрации не найдены. Попробуйте зарегистрироваться заново.');
            window.gameApp.showScreen('loading-screen');
            return false;
        }
        
        // Создаем пользователя с новой системой характеристик
        const newUser = this.createUser(tempData, tempData.password);
        console.log('Новый пользователь создан с новой системой характеристик:', newUser);
        
        // Устанавливаем как текущего пользователя
        this.setCurrentUser(newUser);
        
        // Очищаем временные данные
        delete window.tempRegistrationData;
        
        // Переходим в игру
        setTimeout(() => {
            window.gameApp.showScreen('game-screen');
            this.displayPlayerInfo(newUser);
        }, 100);
        
        return true;
    }
}

// Создаем глобальный экземпляр системы авторизации только если его еще нет
if (!window.authSystem) {
    window.authSystem = new AuthSystem();
}
