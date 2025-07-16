/**
 * Класс для управления персонажем с новой системой характеристик
 */
class Character {
    constructor() {
        // Базовые характеристики - все по 1 (будут переопределены при выборе фракции)
        this.stats = {
            str: 1,
            int: 1,
            cha: 1,
            end: 1,
            dex: 1,
            lck: 1
        };
        
        // Информация о персонаже
        this.nickname = '';
        this.faction = '';
        this.gender = '';
    }
    
    /**
     * Установить информацию о персонаже
     */
    setCharacterInfo(nickname, faction, gender) {
        this.nickname = nickname;
        this.faction = faction;
        this.gender = gender;
        
        // Устанавливаем стартовые характеристики в зависимости от фракции
        this.setFactionStats(faction);
        
        console.log('Информация о персонаже установлена:', { nickname, faction, gender });
        console.log('Стартовые характеристики:', this.stats);
    }
    
    /**
     * Установить характеристики в зависимости от фракции
     */
    setFactionStats(faction) {
        if (faction === 'workers') {
            // Работяги: STR=5, END=5, DEX=3, INT=1, CHA=1, LCK=3
            this.stats = {
                str: 5,
                end: 5,
                dex: 3,
                int: 1,
                cha: 1,
                lck: 3
            };
        } else if (faction === 'creatives') {
            // Креаклы: STR=2, END=2, DEX=2, INT=5, CHA=5, LCK=2
            this.stats = {
                str: 2,
                end: 2,
                dex: 2,
                int: 5,
                cha: 5,
                lck: 2
            };
        }
    }
    
    /**
     * Сбросить характеристики к базовым значениям
     */
    resetStats() {
        this.stats = {
            str: 1,
            int: 1,
            cha: 1,
            end: 1,
            dex: 1,
            lck: 1
        };
        console.log('Характеристики сброшены к базовым значениям');
    }
    
    /**
     * Рассчитать здоровье на основе выносливости
     * Формула: 50 + END * 10
     */
    calculateHealth() {
        return 50 + (this.stats.end * 10);
    }
    
    /**
     * Рассчитать урон (скрытый подстат)
     * Формула: 10 + STR * 3
     */
    calculateDamage() {
        return 10 + (this.stats.str * 3);
    }
    
    /**
     * Рассчитать шанс двойного удара (скрытый подстат)
     * Формула: (DEX * 2 + LCK * 1.5)%
     */
    calculateDoubleHitChance() {
        return (this.stats.dex * 2 + this.stats.lck * 1.5);
    }
    
    /**
     * Рассчитать шанс уворота (скрытый подстат)
     * Формула: (DEX * 1.5 + INT * 2 + LCK * 1)%
     */
    calculateDodgeChance() {
        return (this.stats.dex * 1.5 + this.stats.int * 2 + this.stats.lck * 1);
    }
    
    /**
     * Рассчитать защиту (скрытый подстат)
     * Формула: END * 2
     */
    calculateDefense() {
        return this.stats.end * 2;
    }
    
    /**
     * Получить все рассчитанные характеристики (для отладки)
     */
    getCalculatedStats() {
        return {
            health: this.calculateHealth(),
            damage: this.calculateDamage(),
            doubleHitChance: this.calculateDoubleHitChance(),
            dodgeChance: this.calculateDodgeChance(),
            defense: this.calculateDefense()
        };
    }
    
    /**
     * Получить полные данные персонажа для сохранения
     */
    getCharacterData() {
        return {
            nickname: this.nickname,
            faction: this.faction,
            gender: this.gender,
            stats: { ...this.stats },
            level: 1,
            experience: 0,
            health: this.calculateHealth(),
            gold: 100,
            inventory: [],
            createdAt: new Date().toISOString()
        };
    }
    
    /**
     * Проверить валидность данных персонажа
     */
    isValid() {
        const isValid = this.nickname.length >= 3 && 
               this.faction !== '' && 
               this.gender !== '';
        
        console.log('Проверка валидности персонажа:', {
            nickname: this.nickname,
            nicknameLength: this.nickname.length,
            faction: this.faction,
            gender: this.gender,
            isValid: isValid
        });
        
        return isValid;
    }
    
    /**
     * Увеличить характеристику (для системы тренировок)
     */
    increaseStat(statName, amount = 1) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName] += amount;
            console.log(`${statName} увеличена на ${amount}, новое значение: ${this.stats[statName]}`);
            return true;
        }
        return false;
    }
    
    /**
     * Получить информацию о персонаже для отображения
     */
    getDisplayInfo() {
        const calculatedStats = this.getCalculatedStats();
        const factionName = this.faction === 'workers' ? 'Работяги' : 'Креаклы';
        
        return {
            nickname: this.nickname,
            faction: factionName,
            stats: this.stats,
            health: calculatedStats.health,
            // Скрытые характеристики (не отображаются игроку, но используются в боях)
            _hidden: calculatedStats
        };
    }
}

// Создаем глобальный экземпляр персонажа только если его еще нет
if (!window.gameCharacter) {
    window.gameCharacter = new Character();
}

// Добавляем функцию для отладки характеристик (можно вызывать в консоли)
window.debugCharacterStats = () => {
    const character = window.gameCharacter;
    console.log('=== ХАРАКТЕРИСТИКИ ПЕРСОНАЖА ===');
    console.log('Основные статы:', character.stats);
    console.log('Рассчитанные характеристики:', character.getCalculatedStats());
    console.log('Информация для отображения:', character.getDisplayInfo());
};
