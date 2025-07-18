-- database/map_location_schema.sql - Схема БД для локации Карта

-- Таблица прогресса игроков в локации карта
CREATE TABLE IF NOT EXISTS map_player_progress (
    id BIGSERIAL PRIMARY KEY,
    player_nickname VARCHAR(50) NOT NULL,
    completed_mobs TEXT[] DEFAULT '{}', -- массив завершенных мобов
    crystals INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_nickname)
);

-- Таблица предметов из локации карта
CREATE TABLE IF NOT EXISTS map_player_items (
    id BIGSERIAL PRIMARY KEY,
    player_nickname VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- weapon, armor, accessory
    item_rarity VARCHAR(20) NOT NULL, -- common, rare, epic
    stat_bonus VARCHAR(10) NOT NULL, -- str, end, dex, int, cha, lck, attack, defense
    bonus_value INTEGER NOT NULL,
    item_icon VARCHAR(10) DEFAULT '⚔️',
    obtained_at TIMESTAMP DEFAULT NOW()
);

-- Таблица очередей на мобов
CREATE TABLE IF NOT EXISTS map_battle_queues (
    id BIGSERIAL PRIMARY KEY,
    mob_id VARCHAR(20) NOT NULL, -- wolf, troll, golem, elemental, dragon
    player1_nickname VARCHAR(50),
    player2_nickname VARCHAR(50),
    queue_status VARCHAR(20) DEFAULT 'waiting', -- waiting, ready, started
    timer_started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица активных боев
CREATE TABLE IF NOT EXISTS map_active_battles (
    id VARCHAR(50) PRIMARY KEY,
    mob_id VARCHAR(20) NOT NULL,
    mob_data JSONB NOT NULL, -- данные моба (HP, атака, способности)
    player1_nickname VARCHAR(50) NOT NULL,
    player2_nickname VARCHAR(50) NOT NULL,
    players_data JSONB NOT NULL, -- данные игроков
    current_turn INTEGER DEFAULT 1,
    player_actions JSONB DEFAULT '{}', -- выборы игроков на текущий ход
    battle_log JSONB DEFAULT '[]', -- лог боя
    battle_status VARCHAR(20) DEFAULT 'active', -- active, finished
    battle_result JSONB, -- результат боя
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_map_progress_nickname ON map_player_progress(player_nickname);
CREATE INDEX IF NOT EXISTS idx_map_items_nickname ON map_player_items(player_nickname);
CREATE INDEX IF NOT EXISTS idx_map_queues_mob ON map_battle_queues(mob_id);
CREATE INDEX IF NOT EXISTS idx_map_queues_status ON map_battle_queues(queue_status);
CREATE INDEX IF NOT EXISTS idx_map_battles_status ON map_active_battles(battle_status);
CREATE INDEX IF NOT EXISTS idx_map_battles_players ON map_active_battles(player1_nickname, player2_nickname);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_map_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_map_progress_updated_at 
    BEFORE UPDATE ON map_player_progress 
    FOR EACH ROW EXECUTE FUNCTION update_map_updated_at_column();

CREATE TRIGGER update_map_queues_updated_at 
    BEFORE UPDATE ON map_battle_queues 
    FOR EACH ROW EXECUTE FUNCTION update_map_updated_at_column();

-- Функция для очистки старых данных
CREATE OR REPLACE FUNCTION cleanup_old_map_data()
RETURNS void AS $$
BEGIN
    -- Удаляем старые очереди (старше 10 минут)
    DELETE FROM map_battle_queues 
    WHERE created_at < NOW() - INTERVAL '10 minutes';
    
    -- Удаляем завершенные бои (старше 1 часа)
    DELETE FROM map_active_battles 
    WHERE battle_status = 'finished' 
    AND finished_at < NOW() - INTERVAL '1 hour';
END;
$$ language 'plpgsql';

-- Включаем Row Level Security
ALTER TABLE map_player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_battle_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_active_battles ENABLE ROW LEVEL SECURITY;

-- Политики доступа (все могут читать и писать для мультиплеера)
CREATE POLICY "Anyone can view map progress" ON map_player_progress FOR SELECT USING (true);
CREATE POLICY "Players can manage own progress" ON map_player_progress FOR ALL USING (true);

CREATE POLICY "Anyone can view map items" ON map_player_items FOR SELECT USING (true);
CREATE POLICY "Players can manage own items" ON map_player_items FOR ALL USING (true);

CREATE POLICY "Anyone can view queues" ON map_battle_queues FOR SELECT USING (true);
CREATE POLICY "Players can manage queues" ON map_battle_queues FOR ALL USING (true);

CREATE POLICY "Anyone can view battles" ON map_active_battles FOR SELECT USING (true);
CREATE POLICY "Players can manage battles" ON map_active_battles FOR ALL USING (true);

-- Вставляем начальные данные (если нужно)
-- INSERT INTO map_player_progress (player_nickname, crystals) VALUES ('test_player', 10) ON CONFLICT DO NOTHING;

COMMENT ON TABLE map_player_progress IS 'Прогресс игроков в локации Карта';
COMMENT ON TABLE map_player_items IS 'Предметы игроков из локации Карта';
COMMENT ON TABLE map_battle_queues IS 'Очереди на мобов в локации Карта';
COMMENT ON TABLE map_active_battles IS 'Активные бои в локации Карта';