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
            
            // Кнопка тренировки (новая функциональность)
            const btnTrain = document.querySelector('.train-btn');
            if (btnTrain) {
                btnTrain.addEventListener('click', () => this.showTrainingOptions());
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
                window.gameCharacter.updateStatsDisplay();
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
     * Показать опции тренировки (новая функциональность)
     */
    showTrainingOptions() {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) {
            alert('Ошибка: пользователь не найден');
            return;
        }
        
        // Создаем простое модальное окно для выбора характеристики для тренировки
        const statsNames = {
            str: 'Сила',
            end: 'Выносливость', 
            dex: 'Реакция',
            int: 'Интеллект',
            cha: 'Харизма',
            lck: 'Удача'
        };
        
        let options = 'Выберите характеристику для тренировки:\n\n';
        Object.entries(statsNames).forEach(([key, name], index) => {
            options += `${index + 1}. ${name} (текущий уровень: ${currentUser.stats[key]})\n`;
        });
        
        const choice = prompt(options + '\nВведите номер (1-6):');
        
        if (choice && choice >= 1 && choice <= 6) {
            const statKeys = Object.keys(statsNames);
            const selectedStat = statKeys[choice - 1];
            this.trainStat(selectedStat);
        }
    }
    
    /**
     * Тренировка характеристики
     */
    trainStat(statName) {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        // Простая система тренировки: стоимость = текущий уровень * 10 золота
        const currentLevel = currentUser.stats[statName];
        const cost = currentLevel * 10;
        
        if (currentUser.gold < cost) {
            alert(`Недостаточно золота! Нужно ${cost}, у вас ${currentUser.gold}`);
            return;
        }
        
        // Подтверждение тренировки
        const statNames = {
            str: 'Силу',
            end: 'Выносливость', 
            dex: 'Реакцию',
            int: 'Интеллект',
            cha: 'Харизму',
            lck: 'Удачу'
        };
        
        if (confirm(`Потратить ${cost} золота на тренировку "${statNames[statName]}"?\n(${currentLevel} → ${currentLevel + 1})`)) {
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
            
            // Обновляем отображение
            window.authSystem.displayPlayerInfo(currentUser);
            
            alert(`Тренировка завершена!\n${statNames[statName]} увеличена до ${currentUser.stats[statName]}`);
            
            console.log('Тренировка завершена:', {
                stat: statName,
                newLevel: currentUser.stats[statName],
                goldSpent: cost,
                remainingGold: currentUser.gold
            });
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
     * Показать уведомление
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
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

// Создаем глобальный экземпляр приложения
window.gameApp = new GameApp();

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
