// js/map-location/map-battles.js - Тактическая боевая система для локации карты
class MapBattleSystem {
    constructor() {
        this.actionTypes = this.initializeActionTypes();
        this.mobAbilities = this.initializeMobAbilities();
        
        console.log('⚔️ MapBattleSystem инициализирована');
    }
    
    /**
     * Инициализация типов действий игроков
     */
    initializeActionTypes() {
        return {
            attack: {
                name: '⚔️ Обычная атака',
                description: 'Базовая атака с полным уроном',
                damageMultiplier: 1.0,
                cooldown: 0,
                alwaysAvailable: true
            },
            power_strike: {
                name: '💥 Мощный удар',
                description: 'Сильная атака с увеличенным уроном',
                damageMultiplier: 1.8,
                cooldown: 3,
                alwaysAvailable: false
            },
            defend: {
                name: '🛡️ Защитная стойка', 
                description: 'Снижает входящий урон на 60%',
                damageReduction: 0.6,
                cooldown: 0,
                alwaysAvailable: true
            },
            heal: {
                name: '💚 Исцеление',
                description: 'Восстанавливает 35% от максимального HP',
                healPercent: 0.35,
                maxUses: 2,
                alwaysAvailable: false
            }
        };
    }
    
    /**
     * Инициализация способностей мобов
     */
    initializeMobAbilities() {
        return {
            // Лесной Волк
            bite: {
                name: 'Кусь',
                description: 'Обычная атака случайного игрока',
                type: 'single_attack',
                damageMultiplier: 1.0
            },
            howl: {
                name: 'Вой',
                description: 'Увеличивает атаку на 15% на 2 хода',
                type: 'buff',
                frequency: 4, // каждый 4-й ход
                effect: { attackBonus: 0.15, duration: 2 }
            },
            
            // Горный Тролль
            club_hit: {
                name: 'Удар дубиной',
                description: 'Обычная атака дубиной',
                type: 'single_attack',
                damageMultiplier: 1.0
            },
            earthquake: {
                name: 'Землетрясение',
                description: 'АОЕ атака по всем игрокам',
                type: 'aoe_attack',
                frequency: 3,
                damageMultiplier: 0.75 // меньше урона, но всем
            },
            thick_skin: {
                name: 'Толстая кожа',
                description: 'Постоянно снижает входящий урон на 10%',
                type: 'passive',
                effect: { damageReduction: 0.1 }
            },
            
            // Ледяной Голем
            ice_shard: {
                name: 'Ледышка',
                description: 'Атака с шансом заморозки',
                type: 'single_attack',
                damageMultiplier: 1.0,
                freezeChance: 0.15
            },
            ice_storm: {
                name: 'Ледяная буря',
                description: 'АОЕ атака с шансом заморозки',
                type: 'aoe_attack',
                frequency: 3,
                damageMultiplier: 0.8,
                freezeChance: 0.3
            },
            regeneration: {
                name: 'Восстановление',
                description: 'Лечит 20% HP при здоровье ниже 30%',
                type: 'heal',
                trigger: 0.3, // срабатывает при HP < 30%
                healPercent: 0.2,
                maxUses: 1
            },
            
            // Огненный Элементаль
            fireball: {
                name: 'Огненный шар',
                description: 'Обычная огненная атака',
                type: 'single_attack',
                damageMultiplier: 1.0
            },
            inferno: {
                name: 'Инферно',
                description: 'Мощная АОЕ огненная атака',
                type: 'aoe_attack',
                frequency: 3,
                damageMultiplier: 1.2
            },
            flame_rage: {
                name: 'Ярость пламени',
                description: 'При HP < 25% получает +40% атаки',
                type: 'conditional_buff',
                trigger: 0.25,
                effect: { attackBonus: 0.4, permanent: true }
            },
            
            // Древний Дракон
            claw_strike: {
                name: 'Удар когтями',
                description: 'Обычная атака когтями',
                type: 'single_attack', 
                damageMultiplier: 1.0
            },
            fire_breath: {
                name: 'Огненное дыхание',
                description: 'АОЕ атака огненным дыханием',
                type: 'aoe_attack',
                frequency: 2,
                damageMultiplier: 1.1
            },
            sky_rage: {
                name: 'Небесная ярость',
                description: 'При HP < 50% каждый ход АОЕ + обычная атака',
                type: 'conditional_attack_pattern',
                trigger: 0.5
            },
            last_breath: {
                name: 'Последний вздох',
                description: 'При HP < 10% отчаянная атака с тройным уроном',
                type: 'desperate_attack',
                trigger: 0.1,
                damageMultiplier: 3.0
            }
        };
    }
    
    /**
     * Обработать действие игрока
     */
    processPlayerAction(battleData, playerNickname, actionType) {
        const player = battleData.players.find(p => p.nickname === playerNickname);
        if (!player) {
            throw new Error('Игрок не найден в бою');
        }
        
        const action = this.actionTypes[actionType];
        if (!action) {
            throw new Error('Неизвестный тип действия');
        }
        
        // Проверяем доступность действия
        if (!this.isActionAvailable(player, actionType)) {
            throw new Error('Действие недоступно');
        }
        
        // Сохраняем выбор игрока
        battleData.playerActions[playerNickname] = {
            type: actionType,
            action: action,
            timestamp: Date.now()
        };
        
        console.log(`🎮 ${playerNickname} выбрал действие: ${action.name}`);
        
        // Проверяем, все ли игроки сделали выбор
        if (Object.keys(battleData.playerActions).length === battleData.players.length) {
            this.executeTurn(battleData);
        }
        
        return { success: true, message: `Выбрано: ${action.name}` };
    }
    
    /**
     * Проверить доступность действия
     */
    isActionAvailable(player, actionType) {
        const action = this.actionTypes[actionType];
        
        // Всегда доступные действия
        if (action.alwaysAvailable) {
            return true;
        }
        
        // Проверка кулдауна для мощного удара
        if (actionType === 'power_strike') {
            return player.actions.powerStrikeCooldown <= 0;
        }
        
        // Проверка использований для лечения
        if (actionType === 'heal') {
            return player.actions.healsUsed < action.maxUses;
        }
        
        return false;
    }
    
    /**
     * Выполнить ход боя
     */
    executeTurn(battleData) {
        console.log(`⚔️ Выполняется ход ${battleData.currentTurn}`);
        
        const turnLog = [];
        
        // 1. Обрабатываем действия игроков
        this.processPlayerActions(battleData, turnLog);
        
        // 2. Обрабатываем действия моба
        this.processMobAction(battleData, turnLog);
        
        // 3. Проверяем окончание боя
        const battleResult = this.checkBattleEnd(battleData);
        
        // 4. Обновляем кулдауны и эффекты
        this.updateEffects(battleData);
        
        // 5. Добавляем лог в бой
        battleData.battleLog.push(...turnLog);
        
        // 6. Переходим к следующему ходу или завершаем бой
        if (battleResult) {
            this.finishBattle(battleData, battleResult);
        } else {
            battleData.currentTurn++;
            battleData.playerActions = {}; // Сброс выборов для нового хода
        }
        
        return battleResult;
    }
    
    /**
     * Обработать действия игроков
     */
    processPlayerActions(battleData, turnLog) {
        const players = battleData.players;
        const actions = battleData.playerActions;
        
        // Проверяем комбо-атаки
        const actionTypes = Object.values(actions).map(a => a.type);
        const isCombo = actionTypes.length === 2 && actionTypes[0] === actionTypes[1];
        
        if (isCombo) {
            const comboType = actionTypes[0];
            turnLog.push({
                type: 'combo',
                message: `✨ КОМБО! Оба игрока используют ${this.actionTypes[comboType].name}`,
                turn: battleData.currentTurn
            });
        }
        
        // Выполняем действия каждого игрока
        for (const player of players) {
            if (player.currentHp <= 0) continue; // Мертвые не действуют
            
            const playerAction = actions[player.nickname];
            if (!playerAction) continue;
            
            this.executePlayerAction(battleData, player, playerAction, isCombo, turnLog);
        }
    }
    
    /**
     * Выполнить действие игрока
     */
    executePlayerAction(battleData, player, playerAction, isCombo, turnLog) {
        const action = playerAction.action;
        const actionType = playerAction.type;
        
        switch (actionType) {
            case 'attack':
            case 'power_strike':
                let damage = player.stats.attack * action.damageMultiplier;
                
                // Комбо-бонус
                if (isCombo) {
                    if (actionType === 'attack') damage *= 1.2; // +20%
                    if (actionType === 'power_strike') damage *= 1.5; // +50%
                }
                
                // Применяем урон к мобу
                const mobDefense = battleData.mobData.defense || 0;
                const finalDamage = Math.max(1, Math.floor(damage - mobDefense));
                
                battleData.mobData.currentHp -= finalDamage;
                battleData.mobData.currentHp = Math.max(0, battleData.mobData.currentHp);
                
                turnLog.push({
                    type: 'player_attack',
                    message: `${player.nickname} наносит ${finalDamage} урона (${action.name})`,
                    turn: battleData.currentTurn
                });
                
                // Кулдаун для мощного удара
                if (actionType === 'power_strike') {
                    player.actions.powerStrikeCooldown = action.cooldown;
                }
                break;
                
            case 'defend':
                player.actions.isDefending = true;
                
                turnLog.push({
                    type: 'player_defend',
                    message: `${player.nickname} принимает защитную стойку`,
                    turn: battleData.currentTurn
                });
                
                // Комбо-бонус для защиты
                if (isCombo) {
                    player.actions.comboDefenseBonus = 0.2; // дополнительно +20% защиты
                    turnLog.push({
                        type: 'combo_defense',
                        message: `✨ Парный блок! Дополнительная защита для ${player.nickname}`,
                        turn: battleData.currentTurn
                    });
                }
                break;
                
            case 'heal':
                const healAmount = Math.floor(player.maxHp * action.healPercent);
                const actualHeal = Math.min(healAmount, player.maxHp - player.currentHp);
                
                player.currentHp += actualHeal;
                player.actions.healsUsed++;
                
                turnLog.push({
                    type: 'player_heal',
                    message: `${player.nickname} восстанавливает ${actualHeal} HP (${action.name})`,
                    turn: battleData.currentTurn
                });
                break;
        }
    }
    
    /**
     * Обработать действие моба
     */
    processMobAction(battleData, turnLog) {
        const mob = battleData.mobData;
        if (mob.currentHp <= 0) return; // Мертвый моб не атакует
        
        // Выбираем способность моба
        const ability = this.selectMobAbility(battleData);
        const abilityData = this.mobAbilities[ability];
        
        console.log(`👹 ${mob.name} использует: ${abilityData.name}`);
        
        this.executeMobAbility(battleData, ability, abilityData, turnLog);
    }
    
    /**
     * Выбрать способность моба
     */
    selectMobAbility(battleData) {
        const mob = battleData.mobData;
        const turn = battleData.currentTurn;
        const hpPercent = mob.currentHp / mob.maxHp;
        
        // Проверяем особые условия
        if (mob.id === 'dragon' && hpPercent <= 0.1) {
            return 'last_breath'; // Последний вздох дракона
        }
        
        if (mob.id === 'elemental' && hpPercent <= 0.25 && !mob.rageActivated) {
            mob.rageActivated = true;
            return 'flame_rage';
        }
        
        if (mob.id === 'golem' && hpPercent <= 0.3 && !mob.regenerationUsed) {
            mob.regenerationUsed = true;
            return 'regeneration';
        }
        
        // Проверяем частотные способности
        for (const ability of mob.abilities) {
            const abilityData = this.mobAbilities[ability];
            if (abilityData.frequency && turn % abilityData.frequency === 0) {
                return ability;
            }
        }
        
        // Возвращаем обычную атаку
        return mob.abilities[0] || 'bite';
    }
    
    /**
     * Выполнить способность моба
     */
    executeMobAbility(battleData, abilityId, abilityData, turnLog) {
        const mob = battleData.mobData;
        const alivePlayers = battleData.players.filter(p => p.currentHp > 0);
        
        switch (abilityData.type) {
            case 'single_attack':
                if (alivePlayers.length > 0) {
                    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                    this.mobAttackPlayer(battleData, target, abilityData, turnLog);
                }
                break;
                
            case 'aoe_attack':
                for (const player of alivePlayers) {
                    this.mobAttackPlayer(battleData, player, abilityData, turnLog);
                }
                break;
                
            case 'buff':
                if (!mob.buffs) mob.buffs = {};
                mob.buffs.attackBonus = {
                    value: abilityData.effect.attackBonus,
                    duration: abilityData.effect.duration
                };
                
                turnLog.push({
                    type: 'mob_buff',
                    message: `${mob.name} использует ${abilityData.name}! Атака увеличена!`,
                    turn: battleData.currentTurn
                });
                break;
                
            case 'heal':
                const healAmount = Math.floor(mob.maxHp * abilityData.healPercent);
                const actualHeal = Math.min(healAmount, mob.maxHp - mob.currentHp);
                
                mob.currentHp += actualHeal;
                
                turnLog.push({
                    type: 'mob_heal',
                    message: `${mob.name} использует ${abilityData.name} и восстанавливает ${actualHeal} HP!`,
                    turn: battleData.currentTurn
                });
                break;
                
            case 'conditional_buff':
                if (!mob.permanentBuffs) mob.permanentBuffs = {};
                mob.permanentBuffs.attackBonus = abilityData.effect.attackBonus;
                
                turnLog.push({
                    type: 'mob_rage',
                    message: `${mob.name} впадает в ярость! Атака значительно увеличена!`,
                    turn: battleData.currentTurn
                });
                break;
        }
    }
    
    /**
     * Атака моба по игроку
     */
    mobAttackPlayer(battleData, player, abilityData, turnLog) {
        const mob = battleData.mobData;
        let damage = mob.attack * (abilityData.damageMultiplier || 1.0);
        
        // Применяем баффы моба
        if (mob.buffs && mob.buffs.attackBonus) {
            damage *= (1 + mob.buffs.attackBonus.value);
        }
        if (mob.permanentBuffs && mob.permanentBuffs.attackBonus) {
            damage *= (1 + mob.permanentBuffs.attackBonus);
        }
        
        // Применяем защиту игрока
        if (player.actions.isDefending) {
            damage *= 0.4; // 60% снижение урона
            if (player.actions.comboDefenseBonus) {
                damage *= (1 - player.actions.comboDefenseBonus); // дополнительная защита от комбо
            }
        }
        
        const finalDamage = Math.max(1, Math.floor(damage));
        player.currentHp -= finalDamage;
        player.currentHp = Math.max(0, player.currentHp);
        
        const defenseText = player.actions.isDefending ? ' (блокировано!)' : '';
        turnLog.push({
            type: 'mob_attack',
            message: `${mob.name} наносит ${finalDamage} урона игроку ${player.nickname}${defenseText}`,
            turn: battleData.currentTurn
        });
        
        // Проверяем заморозку
        if (abilityData.freezeChance && Math.random() < abilityData.freezeChance) {
            if (!player.effects) player.effects = {};
            player.effects.frozen = { duration: 1 };
            
            turnLog.push({
                type: 'freeze',
                message: `❄️ ${player.nickname} заморожен и пропустит следующий ход!`,
                turn: battleData.currentTurn
            });
        }
    }
    
    /**
     * Проверить окончание боя
     */
    checkBattleEnd(battleData) {
        const mob = battleData.mobData;
        const alivePlayers = battleData.players.filter(p => p.currentHp > 0);
        
        if (mob.currentHp <= 0) {
            return {
                result: 'victory',
                winners: battleData.players.map(p => p.nickname),
                message: `🏆 Победа! ${mob.name} повержен!`
            };
        }
        
        if (alivePlayers.length === 0) {
            return {
                result: 'defeat',
                message: `💀 Поражение! Все игроки пали в бою с ${mob.name}`
            };
        }
        
        // Проверка на максимальное количество ходов (30)
        if (battleData.currentTurn >= 30) {
            return {
                result: 'timeout',
                message: `⏰ Бой закончился по времени! ${mob.name} остается непобежденным`
            };
        }
        
        return null; // Бой продолжается
    }
    
    /**
     * Обновить эффекты и кулдауны
     */
    updateEffects(battleData) {
        // Обновляем кулдауны игроков
        for (const player of battleData.players) {
            if (player.actions.powerStrikeCooldown > 0) {
                player.actions.powerStrikeCooldown--;
            }
            
            // Сброс защиты (действует только один ход)
            player.actions.isDefending = false;
            player.actions.comboDefenseBonus = null;
            
            // Обновляем эффекты игрока
            if (player.effects) {
                for (const [effect, data] of Object.entries(player.effects)) {
                    if (data.duration > 0) {
                        data.duration--;
                        if (data.duration <= 0) {
                            delete player.effects[effect];
                        }
                    }
                }
            }
        }
        
        // Обновляем баффы моба
        const mob = battleData.mobData;
        if (mob.buffs) {
            for (const [buff, data] of Object.entries(mob.buffs)) {
                if (data.duration > 0) {
                    data.duration--;
                    if (data.duration <= 0) {
                        delete mob.buffs[buff];
                    }
                }
            }
        }
    }
    
    /**
     * Завершить бой
     */
    finishBattle(battleData, result) {
        battleData.status = 'finished';
        battleData.result = result;
        battleData.finishedAt = Date.now();
        
        console.log(`🏁 Бой ${battleData.id} завершен: ${result.result}`);
        
        // Если победа - выдаем награды
        if (result.result === 'victory') {
            this.distributeRewards(battleData);
        }
        
        // Удаляем бой из активных через некоторое время
        setTimeout(() => {
            if (window.mapSystem && window.mapSystem.activeBattles) {
                window.mapSystem.activeBattles.delete(battleData.id);
            }
        }, 300000); // Удаляем через 5 минут
    }
    
    /**
     * Распределить награды после победы
     */
    distributeRewards(battleData) {
        const mob = battleData.mobData;
        const rewards = mob.rewards;
        
        for (const player of battleData.players) {
            // Кристаллы
            const crystals = Math.floor(Math.random() * (rewards.crystals[1] - rewards.crystals[0] + 1)) + rewards.crystals[0];
            window.mapSystem.addCrystals(player.nickname, crystals);
            
            // Опыт и золото (интеграция с основной системой)
            const exp = Math.floor(Math.random() * (rewards.exp[1] - rewards.exp[0] + 1)) + rewards.exp[0];
            const gold = Math.floor(Math.random() * (rewards.gold[1] - rewards.gold[0] + 1)) + rewards.gold[0];
            
            // Предмет (только с босса)
            if (mob.isBoss && rewards.itemChance && Math.random() * 100 < rewards.itemChance) {
                const item = this.generateRandomItem();
                window.mapSystem.addItem(player.nickname, item);
            }
            
            // Отмечаем моба как пройденного
            window.mapSystem.markMobCompleted(player.nickname, mob.id);
            
            console.log(`🎁 Награды для ${player.nickname}: ${crystals} кристаллов, ${exp} опыта, ${gold} золота`);
        }
    }
    
    /**
     * Сгенерировать случайный предмет
     */
    generateRandomItem() {
        const itemTypes = [
            { type: 'weapon', name: 'Оружие', statBonus: 'attack', icon: '⚔️' },
            { type: 'armor', name: 'Броня', statBonus: 'defense', icon: '🛡️' },
            { type: 'accessory', name: 'Аксессуар', statBonus: 'random', icon: '💍' }
        ];
        
        const rarities = [
            { rarity: 'common', name: 'Обычный', chance: 70, multiplier: 1.0, color: '🟢' },
            { rarity: 'rare', name: 'Редкий', chance: 25, multiplier: 1.5, color: '🔵' },
            { rarity: 'epic', name: 'Эпический', chance: 5, multiplier: 2.0, color: '🟣' }
        ];
        
        // Выбираем тип предмета
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        // Выбираем редкость
        const rarityRoll = Math.random() * 100;
        let selectedRarity = rarities[0]; // common по умолчанию
        let chanceSum = 0;
        
        for (const rarity of rarities) {
            chanceSum += rarity.chance;
            if (rarityRoll <= chanceSum) {
                selectedRarity = rarity;
                break;
            }
        }
        
        // Выбираем статистику для бонуса
        let statBonus = itemType.statBonus;
        if (statBonus === 'random') {
            const stats = ['str', 'end', 'dex', 'int', 'cha', 'lck'];
            statBonus = stats[Math.floor(Math.random() * stats.length)];
        }
        
        // Рассчитываем бонус
        const baseBonusRange = { min: 2, max: 5 };
        if (itemType.type === 'armor') {
            baseBonusRange.min = 3;
            baseBonusRange.max = 8;
        } else if (itemType.type === 'weapon') {
            baseBonusRange.min = 4; 
            baseBonusRange.max = 10;
        }
        
        const baseBonus = Math.floor(Math.random() * (baseBonusRange.max - baseBonusRange.min + 1)) + baseBonusRange.min;
        const finalBonus = Math.floor(baseBonus * selectedRarity.multiplier);
        
        return {
            name: `${selectedRarity.color} ${selectedRarity.name} ${itemType.name}`,
            type: itemType.type,
            rarity: selectedRarity.rarity,
            stat: statBonus,
            bonus: finalBonus,
            icon: itemType.icon
        };
    }
}

// Создаем глобальный экземпляр
if (!window.mapBattleSystem) {
    window.mapBattleSystem = new MapBattleSystem();
    console.log('⚔️ Тактическая боевая система карты инициализирована');
}