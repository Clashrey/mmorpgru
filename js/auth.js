// Исправленная функция displayPlayerInfo из auth.js
// Проблема была в строке 286 - неправильная обработка фракции

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
    
    // ИСПРАВЛЕНИЕ: Проверяем существование элемента перед использованием
    const factionBadge = document.getElementById('character-faction-badge');
    if (factionBadge && user.faction) {
        const factionName = user.faction === 'workers' ? 'Работяги' : 'Креаклы';
        factionBadge.textContent = factionName;
    }
    
    console.log('Отображена информация о персонаже с новой системой характеристик');
    console.log('Рассчитанное HP:', calculatedHP);
}
