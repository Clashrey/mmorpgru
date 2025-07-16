/**
 * Главный класс приложения с поддержкой новой системы характеристик
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
            
            // Кнопка тренировки (переход в спортзал)
            const btnTrain = document.querySelector('.train-btn');
            if (btnTrain) {
                btnTrain.addEventListener('click', () => this.showGym());
            }
            
            // Кнопка возврата из спортзала
            const gymBackBtn = document.getElementById('gym-back-btn');
            if (gymBackBtn) {
                gymBackBtn.addEventListener('click', () => this.showScreen('game-screen'));
            }
            
            // Кнопки тренировок в спортзале
            document.querySelectorAll('.upgrade-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const stat = e.target.dataset.stat;
                    this.trainStat(stat);
                });
            });
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
                // Обновляем отображение характеристик (если функция существует)
                if (window.gameCharacter && window.gameCharacter.updateStatsDisplay) {
                    window.gameCharacter.updateStatsDisplay();
                }
                break;
                
            case 'gym-screen':
                // Обновляем отображение спортзала
                const currentUser = window.authSystem.getCurrentUser();
                if (currentUser) {
                    this.updateGymDisplay(currentUser);
                }
                break;
                
            case 'register-screen':
                this.clearForm('register-form');
                this.initRegisterButton();
                break;
                
            case 'login-screen':
                this.clearForm('login-form');
                break;
                
            case 'loading-screen':
                if (window.tempRegistrationData) {
                    delete window.tempRegistrationData;
                }
                window.gameCharacter.resetStats();
                break;
        }
    }
    
    /**
     * Показать спортзал
     */
    showGym() {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) {
            alert('Ошибка: пользователь не найден');
            return;
        }
        
        // Переходим в спортзал
        this.showScreen('gym-screen');
        this.updateGymDisplay(currentUser);
    }
    
    /**
     * Обновить отображение спортзала
     */
    updateGymDisplay(user) {
        // Обновляем золото
        document.getElementById('gym-player-gold').textContent = user.gold || 0;
        
        // Обновляем характеристики
        if (user.stats) {
            document.getElementById('gym-stat-str').textContent = user.stats.str;
            document.getElementById('gym-stat-end').textContent = user.stats.end;
            document.getElementById('gym-stat-dex').textContent = user.stats.dex;
            document.getElementById('gym-stat-int').textContent = user.stats.int;
            document.getElementById('gym-stat-cha').textContent = user.stats.cha;
            document.getElementById('gym-stat-lck').textContent = user.stats.lck;
        }
        
        // Обновляем стоимость тренировок
        this.updateTrainingCosts(user);
    }
    
    /**
     * Обновить стоимость тренировок
     */
    updateTrainingCosts(user) {
        const baseCosts = {
            str: 2.0,   // Самый дорогой
            end: 1.7,   // Второй по дороговизне
            dex: 1.2,   // Средний
            lck: 1.1,   // Чуть дороже базы
            int: 1.0,   // Базовая цена
            cha: 0.8    // Дешевый
        };
        
        Object.keys(baseCosts).forEach(stat => {
            const currentLevel = user.stats[stat];
            const cost = Math.floor(baseCosts[stat] * Math.pow(currentLevel, 1.5) * 10);
            
            const costElement = document.getElementById(`gym-cost-${stat}`);
            const buttonElement = document.querySelector(`[data-stat="${stat}"]`);
            
            if (costElement) {
                costElement.textContent = cost;
                
                if (buttonElement) {
                    // Проверяем, хватает ли денег
                    if (cost > user.gold) {
                        buttonElement.disabled = true;
                        buttonElement.classList.add('cant-afford');
                        buttonElement.classList.remove('expensive');
                    } else {
                        buttonElement.disabled = false;
                        buttonElement.classList.remove('cant-afford');
                        
                        // Красим дорогие статы в красный
                        if (stat === 'str' || stat === 'end') {
                            buttonElement.classList.add('expensive');
                        } else {
                            buttonElement.classList.remove('expensive');
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Инициализация кнопки регистрации с новой системой характеристик
     */
    initRegisterButton() {
        console.log('Инициализация кнопки регистрации...');
        
        setTimeout(() => {
            const btnContinueRegistration = document.getElementById('btn-continue-registration');
            
            if (btnContinueRegistration) {
                // Убираем старые обработчики
                const newBtn = btnContinueRegistration.cloneNode(true);
                btnContinueRegistration.parentNode.replaceChild(newBtn, btnContinueRegistration);
                
                newBtn.addEventListener('click', () => {
                    console.log('Кнопка Продолжить нажата');
                    
                    try {
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
                        
                        // Валидация
                        if (nickname.length < 3) {
                            return;
                        }
                        
                        if (password.length < 6) {
                            return;
                        }
                        
                        if (password !== passwordRepeat) {
                            return;
                        }
                        
                        if (!faction) {
                            return;
                        }
                        
                        if (!gender) {
                            return;
                        }
                        
                        // Проверка существования пользователя
                        if (window.authSystem && window.authSystem.userExists(nickname)) {
                            return;
                        }
                        
                        // Создаем персонажа с новой системой характеристик
                        window.gameCharacter.setCharacterInfo(nickname, faction, gender);
                        
                        const characterData = window.gameCharacter.getCharacterData();
                        console.log('Создаем персонажа с новой системой:', characterData);
                        
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
                    }
                });
                
                console.log('Обработчик события добавлен к кнопке');
            } else {
                console.error('Кнопка btn-continue-registration не найдена!');
            }
        }, 100);
    }
    
    /**
     * Тренировка характеристики с новой системой стоимости
     */
    trainStat(statName) {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        // Базовые множители стоимости
        const baseCosts = {
            str: 2.0,   // Самый дорогой
            end: 1.7,   // Второй по дороговизне
            dex: 1.2,   // Средний
            lck: 1.1,   // Чуть дороже базы
            int: 1.0,   // Базовая цена
            cha: 0.8    // Дешевый
        };
        
        const currentLevel = currentUser.stats[statName];
        const cost = Math.floor(baseCosts[statName] * Math.pow(currentLevel, 1.5) * 10);
        
        if (currentUser.gold < cost) {
            return; // Просто не выполняем действие
        }
        
        // Увеличиваем характеристику и тратим золото
        currentUser.stats[statName] += 1;
        currentUser.gold -= cost;
        
        // Если тренируем выносливость, пересчитываем здоровье
        if (statName === 'end') {
            currentUser.health = 50 + currentUser.stats.end * 10;
        }
        
        // Сохраняем обновленного пользователя
        const users = window.authSystem.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            window.authSystem.saveUsers(users);
            window.authSystem.setCurrentUser(currentUser);
        }
        
        // Обновляем отображение в спортзале
        this.updateGymDisplay(currentUser);
        
        // Обновляем отображение в основном интерфейсе
        window.authSystem.displayPlayerInfo(currentUser);
        
        console.log('Тренировка завершена:', {
            stat: statName,
            newLevel: currentUser.stats[statName],
            goldSpent: cost,
            remainingGold: currentUser.gold
        });
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
            setTimeout(() => {
                const currentUser = window.authSystem.getCurrentUser();
                if (currentUser) {
                    this.showScreen('game-screen');
                    window.authSystem.displayPlayerInfo(currentUser);
                } else {
                    this.showScreen('loading-screen');
                }
            }, 100);
        });
    }
    
    /**
     * Показать уведомление (убираем визуальные уведомления)
     */
    showNotification(message, type = 'info') {
        // Только в консоль
        console.log(`[${type.toUpperCase()}] ${message}`);
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
     * Дебаг информация с новой системой характеристик
     */
    getDebugInfo() {
        const currentUser = window.authSystem.getCurrentUser();
        let characterInfo = null;
        
        if (currentUser && currentUser.stats) {
            // Создаем временный объект Character для расчета скрытых характеристик
            const tempCharacter = new Character();
            tempCharacter.stats = currentUser.stats;
            characterInfo = tempCharacter.getCalculatedStats();
        }
        
        return {
            currentScreen: this.currentScreen,
            gameStats: this.getGameStats(),
            currentUserStats: currentUser ? currentUser.stats : null,
            calculatedStats: characterInfo,
            localStorage: {
                users: localStorage.getItem('mmo_rpg_users'),
                currentUser: localStorage.getItem('mmo_rpg_current_user')
            }
        };
    }
}

// Создаем глобальный экземпляр приложения только если его еще нет
if (!window.gameApp) {
    window.gameApp = new GameApp();
}

// Добавляем глобальные функции для дебага
window.debugGame = () => {
    console.log('=== DEBUG INFO ===');
    console.log(window.gameApp.getDebugInfo());
};

window.debugCharacterCalculations = () => {
    const currentUser = window.authSystem.getCurrentUser();
    if (currentUser && currentUser.stats) {
        const tempCharacter = new Character();
        tempCharacter.stats = currentUser.stats;
        
        console.log('=== РАСЧЕТЫ ХАРАКТЕРИСТИК ===');
        console.log('Основные статы:', currentUser.stats);
        console.log('Рассчитанные характеристики:', tempCharacter.getCalculatedStats());
        console.log('HP:', tempCharacter.calculateHealth());
        console.log('Урон:', tempCharacter.calculateDamage());
        console.log('Шанс двойного удара:', tempCharacter.calculateDoubleHitChance() + '%');
        console.log('Шанс уворота:', tempCharacter.calculateDodgeChance() + '%');
        console.log('Защита:', tempCharacter.calculateDefense());
    } else {
        console.log('Пользователь не найден или нет характеристик');
    }
};

window.clearGameData = () => {
    if (confirm('Удалить все данные игры? Это действие нельзя отменить!')) {
        localStorage.removeItem('mmo_rpg_users');
        localStorage.removeItem('mmo_rpg_current_user');
        window.gameApp.showScreen('loading-screen');
        alert('Данные игры очищены!');
    }
};
