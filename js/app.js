/**
 * Главный класс приложения
 */
class GameApp {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.initializeEventListeners();
        this.checkAutoLogin();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Кнопки главного меню
            const btnRegister = document.getElementById('btn-register');
            const btnLogin = document.getElementById('btn-login');
            
            if (btnRegister) {
                btnRegister.addEventListener('click', () => this.showScreen('register-screen'));
            }
            
            if (btnLogin) {
                btnLogin.addEventListener('click', () => this.showScreen('login-screen'));
            }
            
            // Кнопки "Назад"
            const btnBack = document.getElementById('btn-back');
            const btnLoginBack = document.getElementById('btn-login-back');
            const btnCharBack = document.getElementById('btn-char-back');
            
            if (btnBack) {
                btnBack.addEventListener('click', () => this.showScreen('loading-screen'));
            }
            
            if (btnLoginBack) {
                btnLoginBack.addEventListener('click', () => this.showScreen('loading-screen'));
            }
            
            if (btnCharBack) {
                btnCharBack.addEventListener('click', () => {
                    // Сбрасываем характеристики при возврате
                    window.gameCharacter.resetStats();
                    this.showScreen('register-screen');
                });
            }
            
            // Кнопка создания персонажа
            const btnCreateCharacter = document.getElementById('btn-create-character');
            if (btnCreateCharacter) {
                btnCreateCharacter.addEventListener('click', () => {
                    window.authSystem.completeCharacterCreation();
                });
            }
            
            // Кнопка выхода
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                    window.authSystem.logout();
                });
            }
        });
    }
    
    /**
     * Показать определенный экран
     */
    showScreen(screenId) {
        // Скрываем все экраны
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показываем нужный экран
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Выполняем специфичные действия для экранов
            this.onScreenShow(screenId);
        }
    }
    
    /**
     * Действия при показе экрана
     */
    onScreenShow(screenId) {
        switch (screenId) {
            case 'character-screen':
                // Обновляем отображение характеристик
                window.gameCharacter.updateStatsDisplay();
                break;
                
            case 'register-screen':
                // Очищаем форму регистрации
                this.clearForm('register-form');
                // Добавляем обработчик для кнопки продолжения при показе экрана
                this.initRegisterButton();
                break;
                
            case 'login-screen':
                // Очищаем форму входа
                this.clearForm('login-form');
                break;
                
            case 'loading-screen':
                // Очищаем временные данные
                if (window.tempRegistrationData) {
                    delete window.tempRegistrationData;
                }
                window.gameCharacter.resetStats();
                break;
        }
    }
    
    /**
     * Инициализация кнопки регистрации
     */
    initRegisterButton() {
        console.log('Инициализация кнопки регистрации...');
        
        // Используем setTimeout чтобы элемент точно успел появиться в DOM
        setTimeout(() => {
            const btnContinueRegistration = document.getElementById('btn-continue-registration');
            console.log('Кнопка найдена:', btnContinueRegistration);
            
            if (btnContinueRegistration) {
                // Убираем старые обработчики
                const newBtn = btnContinueRegistration.cloneNode(true);
                btnContinueRegistration.parentNode.replaceChild(newBtn, btnContinueRegistration);
                
                newBtn.addEventListener('click', () => {
                    console.log('Кнопка Продолжить нажата');
                    
                    try {
                        // Валидируем форму регистрации вручную
                        const form = document.getElementById('register-form');
                        if (!form) {
                            console.error('Форма регистрации не найдена');
                            return;
                        }
                        
                        const formData = new FormData(form);
                        const nickname = formData.get('nickname')?.trim() || '';
                        const password = formData.get('password') || '';
                        const passwordRepeat = formData.get('password-repeat') || '';
                        const faction = formData.get('faction') || '';
                        const gender = formData.get('gender') || '';
                        
                        console.log('Данные формы:', { nickname, password, passwordRepeat, faction, gender });
                        
                        // Простая валидация
                        if (nickname.length < 3) {
                            alert('Никнейм должен содержать минимум 3 символа');
                            return;
                        }
                        
                        if (password.length < 6) {
                            alert('Пароль должен содержать минимум 6 символов');
                            return;
                        }
                        
                        if (password !== passwordRepeat) {
                            alert('Пароли не совпадают');
                            return;
                        }
                        
                        if (!faction) {
                            alert('Выберите фракцию');
                            return;
                        }
                        
                        if (!gender) {
                            alert('Выберите пол персонажа');
                            return;
                        }
                        
                        // Проверка существования пользователя
                        if (window.authSystem && window.authSystem.userExists(nickname)) {
                            alert('Пользователь с таким никнеймом уже существует!');
                            return;
                        }
                        
                        // Создаем персонажа
                        const characterData = {
                            nickname: nickname,
                            faction: faction,
                            gender: gender,
                            stats: { str: 1, int: 1, cha: 1, end: 1, dex: 1, lck: 1 },
                            level: 1,
                            experience: 0,
                            health: 105, // 100 + 1*5
                            mana: 55,    // 50 + 1*5
                            gold: 100,
                            inventory: [],
                            createdAt: new Date().toISOString()
                        };
                        
                        console.log('Создаем персонажа:', characterData);
                        
                        // Создаем пользователя
                        if (window.authSystem) {
                            const newUser = window.authSystem.createUser(characterData, password);
                            window.authSystem.setCurrentUser(newUser);
                            
                            console.log('Пользователь создан:', newUser);
                            
                            // Переходим в игру
                            this.showScreen('game-screen');
                            window.authSystem.displayPlayerInfo(newUser);
                        } else {
                            console.error('authSystem не найден');
                        }
                        
                    } catch (error) {
                        console.error('Ошибка при создании персонажа:', error);
                        alert('Произошла ошибка при создании персонажа');
                    }
                });
                
                console.log('Обработчик события добавлен к кнопке');
            } else {
                console.error('Кнопка btn-continue-registration не найдена!');
            }
        }, 100);
    }
    
    /**
     * Очистить форму
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Сбрасываем стили валидации
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.style.borderColor = '#444';
            });
        }
    }
    
    /**
     * Проверка автоматического входа
     */
    checkAutoLogin() {
        document.addEventListener('DOMContentLoaded', () => {
            // Добавляем небольшую задержку для загрузки всех компонентов
            setTimeout(() => {
                const currentUser = window.authSystem.getCurrentUser();
                if (currentUser) {
                    // Если пользователь уже авторизован, показываем игровой экран
                    this.showScreen('game-screen');
                    window.authSystem.displayPlayerInfo(currentUser);
                } else {
                    // Иначе показываем стартовый экран
                    this.showScreen('loading-screen');
                }
            }, 100);
        });
    }
    
    /**
     * Показать уведомление
     */
    showNotification(message, type = 'info') {
        // Простая реализация уведомлений
        // В будущем можно заменить на более красивые
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Показываем через alert пока что
        if (type === 'error') {
            alert(`Ошибка: ${message}`);
        } else if (type === 'success') {
            alert(`Успех: ${message}`);
        }
    }
    
    /**
     * Получить статистику игры
     */
    getGameStats() {
        const users = window.authSystem.getUsers();
        const workersCount = users.filter(user => user.faction === 'workers').length;
        const creativesCount = users.filter(user => user.faction === 'creatives').length;
        
        return {
            totalUsers: users.length,
            workersCount,
            creativesCount,
            currentUser: window.authSystem.getCurrentUser()
        };
    }
    
    /**
     * Дебаг информация
     */
    getDebugInfo() {
        return {
            currentScreen: this.currentScreen,
            gameStats: this.getGameStats(),
            localStorage: {
                users: localStorage.getItem('mmo_rpg_users'),
                currentUser: localStorage.getItem('mmo_rpg_current_user')
            }
        };
    }
}

// Создаем глобальный экземпляр приложения
window.gameApp = new GameApp();

// Добавляем глобальные функции для дебага (можно вызывать в консоли)
window.debugGame = () => {
    console.log('=== DEBUG INFO ===');
    console.log(window.gameApp.getDebugInfo());
};

window.clearGameData = () => {
    if (confirm('Удалить все данные игры? Это действие нельзя отменить!')) {
        localStorage.removeItem('mmo_rpg_users');
        localStorage.removeItem('mmo_rpg_current_user');
        window.gameApp.showScreen('loading-screen');
        alert('Данные игры очищены!');
    }
};
