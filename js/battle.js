/**
 * Боевая система для ММО-РПГ
 */
class BattleSystem {
    constructor() {
        this.currentBattle = null;
        this.mobNames = [
            'Злой Гоблин', 'Дикий Волк', 'Бандит', 'Скелет-воин', 'Орк-берсерк',
            'Зомби', 'Паук-охотник', 'Темный маг', 'Разбойник', 'Тролль'
        ];
        this.initializeEventListeners();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Обработчики с задержкой для корректной инициализации
            setTimeout(() => {
                // Кнопки в арене
                const findPlayerBtn = document.getElementById('find-player-btn');
                const findMobBtn = document.getElementById('find-mob-btn');
                const startFightBtn = document.getElementById('start-fight-btn');
                const continueBtn = document.getElementById('continue-btn');
                const arenaBackBtn = document.getElementById('arena-back-btn');
                const gymBackBtn = document.getElementById('gym-back-btn');
                
                if (findPlayerBtn) {
                    findPlayerBtn.addEventListener('click', () => this.findOpponent('player'));
                }
                
                if (findMobBtn) {
                    findMobBtn.addEventListener('click', () => this.findOpponent('mob'));
                }
                
                if (startFightBtn) {
                    startFightBtn.addEventListener('click', () => this.startBattle());
                }
                
                if (continueBtn) {
                    continueBtn.addEventListener('click', () => this.returnToArena());
                }
                
                if (arenaBackBtn) {
                    arenaBackBtn.addEventListener('click', () => this.backToGame());
                }
                
                if (gymBackBtn) {
                    gymBackBtn.addEventListener('click', () => this.backToGame());
                }
                
                // Кнопки тренировок в спортзале
                document.querySelectorAll('.upgrade-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const stat = e.target.dataset.stat;
                        if (window.gameApp && window.gameApp.trainStat) {
                            window.gameApp.trainStat(stat);
                        }
                    });
                });
            }, 500);
        });
    }
    
    /**
     * Показать арену
     */
    showArena() {
        const currentUser = window.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        window.gameApp.showScreen('arena-screen');
        this.updateArenaDisplay(currentUser);
    }
    
    /**
     * Обновить отображение арены
     */
    updateArenaDisplay(user) {
        const battleStats = this.calculateBattleStats(user);
        
        // Обновляем информацию об игроке
        document.getElementById('arena-player-name').textContent = user.nickname;
        document.getElementById('arena-player-hp').textContent = battleStats.hp;
        document.getElementById('arena-player-attack').textContent = battleStats.attack;
        document.getElementById('arena-player-defense').textContent = battleStats.defense;
        
        const factionName = user.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('arena-player-faction').textContent = factionName;
        
        // Скрываем результаты предыдущих боев
        document.getElementById('battle-result').style.display = 'none';
    }
    
    /**
     * Рассчитать боевые характеристики
     */
    calculateBattleStats(user) {
        const stats = user.stats || {};
        
        return {
            hp: 50 + (stats.end || 1) * 10,
            attack: 10 + (stats.str || 1) * 3,
            defense: (stats.end || 1) * 2,
            dodgeChance: ((stats.dex || 1) * 1.5 + (stats.int || 1) * 2 + (stats.lck || 1) * 1),
            doubleHitChance: ((stats.dex || 1) * 2 + (stats.lck || 1) * 1.5),
            speed: stats.dex || 1
        };
    }
    
    /**
     * Показать экран подготовки к бою
     */
    showBattleSetup(player, opponent) {
        const playerStats = this.calculateBattleStats(player);
        const opponentStats = this.calculateBattleStats(opponent);
        
        // Заполняем данные игрока
        document.getElementById('fighter1-name').textContent = player.nickname;
        document.getElementById('fighter1-hp').textContent = playerStats.hp;
        document.getElementById('fighter1-attack').textContent = playerStats.attack;
        document.getElementById('fighter1-defense').textContent = playerStats.defense;
        
        const playerFaction = player.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('fighter1-faction').textContent = playerFaction;
        
        // Заполняем данные противника
        document.getElementById('fighter2-name').textContent = opponent.nickname;
        document.getElementById('fighter2-hp').textContent = opponentStats.hp;
        document.getElementById('fighter2-attack').textContent = opponentStats.attack;
        document.getElementById('fighter2-defense').textContent = opponentStats.defense;
        
        const opponentFaction = opponent.faction === 'workers' ? 'Работяги' : 'Креаклы';
        document.getElementById('fighter2-faction').textContent = opponentFaction;
        
        // Сохраняем данные боя
        this.currentBattle = {
            player: { ...player, battleStats: playerStats },
            opponent: { ...opponent, battleStats: opponentStats },
            log: [],
            winner: null,
            rewards: null
        };
        
        // Показываем секцию результата
        document.getElementById('battle-result').style.display = 'block';
        document.getElementById('battle-log').style.display = 'none';
        document.getElementById('battle-outcome').style.display = 'none';
        document.getElementById('start-fight-btn').style.display = 'block';
    }
    
    /**
     * Начать бой
     */
    startBattle() {
        if (!this.currentBattle) return;
        
        // Скрываем кнопку начала боя
        document.getElementById('start-fight-btn').style.display = 'none';
        
        // Показываем лог боя
        document.getElementById('battle-log').style.display = 'block';
        
        // Симулируем бой
        this.simulateBattle();
    }
    
    /**
     * Вернуться в арену
     */
    returnToArena() {
        this.currentBattle = null;
        document.getElementById('battle-result').style.display = 'none';
    }
    
    /**
     * Сохранить награды через Supabase
     */
    async saveRewards(user, exp, gold) {
        try {
            // Обновляем через Supabase
            const updatedUser = await window.supabaseClient.savePlayer(user);
            window.authSystem.setCurrentUser(updatedUser);
            
            // Обновляем отображение
            if (window.authSystem.displayPlayerInfo) {
                window.authSystem.displayPlayerInfo(updatedUser);
            }
            
            console.log('✅ Награды сохранены в Supabase');
        } catch (error) {
            console.error('❌ Ошибка сохранения наград:', error);
            alert('Ошибка сохранения наград на сервере');
        }
    }
    
    /**
     * Вернуться в игру
     */
    backToGame() {
        if (window.gameApp) {
            window.gameApp.showScreen('game-screen');
        }
    }
    
    /**
     * Симулировать бой
     */
    simulateBattle() {
        const battle = this.currentBattle;
        if (!battle) return;
        
        // Простая симуляция боя
        const isVictory = Math.random() > 0.3; // 70% шанс победы
        
        setTimeout(() => {
            this.showBattleOutcome(isVictory);
        }, 2000);
    }
    
    /**
     * Показать результат боя
     */
    showBattleOutcome(isVictory) {
        document.getElementById('battle-log').style.display = 'none';
        
        const outcomeDiv = document.getElementById('battle-outcome');
        
        if (isVictory) {
            outcomeDiv.className = 'battle-outcome';
            document.getElementById('outcome-title').textContent = '🏆 ПОБЕДА!';
            document.getElementById('outcome-description').textContent = 'Вы одержали убедительную победу!';
            
            // Награды
            const exp = 10 + Math.floor(Math.random() * 10);
            const gold = 25 + Math.floor(Math.random() * 50);
            
            document.getElementById('reward-exp').textContent = exp;
            document.getElementById('reward-gold').textContent = gold;
            
            // Обновляем игрока через Supabase
            const currentUser = window.authSystem.getCurrentUser();
            if (currentUser) {
                currentUser.experience = (currentUser.experience || 0) + exp;
                currentUser.gold = (currentUser.gold || 0) + gold;
                
                // Сохраняем через Supabase
                this.saveRewards(currentUser, exp, gold);
            }
        } else {
            outcomeDiv.className = 'battle-outcome defeat';
            document.getElementById('outcome-title').textContent = '💀 ПОРАЖЕНИЕ';
            document.getElementById('outcome-description').textContent = 'Вы потерпели поражение...';
            
            document.getElementById('reward-exp').textContent = '0';
            document.getElementById('reward-gold').textContent = '0';
        }
        
        outcomeDiv.style.display = 'block';
    }
}

// Создаем глобальный экземпляр
if (!window.battleSystem) {
    window.battleSystem = new BattleSystem();
}
