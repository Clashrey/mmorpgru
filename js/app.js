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
            
            // Кнопка продолжения регистрации
            const btnContinueRegistration = document.getElementById('btn-continue-registration');
            if (btnContinueRegistration) {
                btnContinueRegistration.addEventListener('click', () => {
                    // Валидируем форму регистрации вручную
                    const form = document.getElementById('register-form');
                    if (form) {
                        const formData = new FormData(form);
                        const nickname = formData.get('nickname')?.trim();
                        const password = formData.get('password');
                        const passwordRepeat = formData.get('password-repeat');
                        const faction = formData.get('faction');
                        const gender = formData.get('gender');
                        
                        // Валидация
                        const validation = window.authSystem.validateRegistration(nickname, password, passwordRepeat, faction, gender);
                        if (!validation.isValid) {
                            window.authSystem.showError(validation.message);
                            return;
                        }
                        
                        // Проверка существования пользователя
                        if (window.authSystem.userExists(nickname)) {
                            window.authSystem.showError('Пользователь с таким никнеймом уже существует!');
                            return;
                        }
                        
                        // Сохраняем данные регистрации
                        window.tempRegistrationData = {
                            nickname,
                            password,
                            faction,
                            gender
                        };
                        
                        // Передаем данные в персонажа
                        window.gameCharacter.setCharacterInfo(nickname, faction, gender);
                        
                        // Переходим к созданию персонажа
                        this.showScreen('character-screen');
                    }
                });
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
