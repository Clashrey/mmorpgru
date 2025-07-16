/**
 * Класс для управления персонажем
 */
class Character {
    constructor() {
        // Базовые характеристики
        this.stats = {
            str: 5,
            int: 5,
            cha: 5,
            end: 5,
            dex: 5,
            lck: 5
        };
        
        // Свободные очки для распределения
        this.freePoints = 20;
        this.updateStatsDisplay();
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
            mana: this.calculateMana(),
            gold: 100, // Стартовое золото
            inventory: [],
            createdAt: new Date().toISOString()
        };
    }
    
    /**
     * Рассчитать здоровье на основе выносливости
     */
    calculateHealth() {
        return 50 + (this.stats.end * 10);
    }
    
    /**
     * Рассчитать ману на основе интеллекта
     */
    calculateMana() {
        return 30 + (this.stats.int * 8);
    }
    
    /**
     * Проверить валидность данных персонажа
     */
    isValid() {
        const isValid = this.nickname.length >= 3 && 
               this.faction !== '' && 
               this.gender !== '' && 
               this.freePoints === 0;
        
        console.log('Проверка валидности персонажа:', {
            nickname: this.nickname,
            nicknameLength: this.nickname.length,
            faction: this.faction,
            gender: this.gender,
            freePoints: this.freePoints,
            isValid: isValid
        });
        
        return isValid;
    }
}

// Создаем глобальный экземпляр персонажа
window.gameCharacter = new Character();
        
        // Минимальные и максимальные значения характеристик
        this.minStat = 1;
        this.maxStat = 15;
        
        // Информация о персонаже
        this.nickname = '';
        this.faction = '';
        this.gender = '';
        
        this.initializeEventListeners();
    }
    
    /**
     * Инициализация обработчиков событий для кнопок характеристик
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Обработчики для кнопок изменения характеристик
            const statButtons = document.querySelectorAll('.stat-btn');
            statButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const stat = e.target.dataset.stat;
                    const action = e.target.dataset.action;
                    
                    if (action === 'increase') {
                        this.increaseStat(stat);
                    } else if (action === 'decrease') {
                        this.decreaseStat(stat);
                    }
                });
            });
        });
    }
    
    /**
     * Увеличить характеристику
     */
    increaseStat(statName) {
        if (this.freePoints > 0 && this.stats[statName] < this.maxStat) {
            this.stats[statName]++;
            this.freePoints--;
            this.updateStatsDisplay();
        }
    }
    
    /**
     * Уменьшить характеристику
     */
    decreaseStat(statName) {
        if (this.stats[statName] > this.minStat) {
            this.stats[statName]--;
            this.freePoints++;
            this.updateStatsDisplay();
        }
    }
    
    /**
     * Обновить отображение характеристик
     */
    updateStatsDisplay() {
        // Обновляем значения характеристик
        Object.keys(this.stats).forEach(stat => {
            const element = document.getElementById(`stat-${stat}`);
            if (element) {
                element.textContent = this.stats[stat];
            }
        });
        
        // Обновляем количество свободных очков
        const freePointsElement = document.getElementById('free-points');
        if (freePointsElement) {
            freePointsElement.textContent = this.freePoints;
        }
        
        // Управляем состоянием кнопок
        this.updateButtonStates();
        
        // Проверяем, можно ли создать персонажа
        this.updateCreateButtonState();
    }
    
    /**
     * Обновить состояние кнопок (активны/неактивны)
     */
    updateButtonStates() {
        Object.keys(this.stats).forEach(stat => {
            const increaseBtn = document.querySelector(`[data-stat="${stat}"][data-action="increase"]`);
            const decreaseBtn = document.querySelector(`[data-stat="${stat}"][data-action="decrease"]`);
            
            if (increaseBtn) {
                increaseBtn.disabled = (this.freePoints === 0 || this.stats[stat] >= this.maxStat);
            }
            
            if (decreaseBtn) {
                decreaseBtn.disabled = (this.stats[stat] <= this.minStat);
            }
        });
    }
    
    /**
     * Обновить состояние кнопки создания персонажа
     */
    updateCreateButtonState() {
        const createBtn = document.getElementById('btn-create-character');
        if (createBtn) {
            // Можно создать персонажа только если потрачены все очки
            createBtn.disabled = this.freePoints > 0;
        }
    }
    
    /**
     * Установить информацию о персонаже
     */
    setCharacterInfo(nickname, faction, gender) {
        this.nickname = nickname;
        this.faction = faction;
        this.gender = gender;
        
        this.updateCharacterPreview();
    }
    
    /**
     * Обновить превью персонажа
     */
    updateCharacterPreview() {
        const nameElement = document.getElementById('char-name');
        const factionElement = document.getElementById('char-faction');
        const genderElement = document.getElementById('char-gender');
        
        if (nameElement) nameElement.textContent = this.nickname;
        if (factionElement) {
            const factionName = this.faction === 'workers' ? 'Работяги' : 'Креаклы';
            factionElement.textContent = `Фракция: ${factionName}`;
        }
        if (genderElement) {
            const genderName = this.gender === 'male' ? 'Мужской' : 'Женский';
            genderElement.textContent = `Пол: ${genderName}`;
        }
    }
    
    /**
     * Сбросить характеристики к базовым значениям
     */
    resetStats() {
        this.stats = {
            str: 5,
            int: 5,
            cha: 5,
            end: 5,
            dex: 5,
            lck: 5
        };
        this.freePoints = 20;
