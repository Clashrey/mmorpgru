-- ИСПРАВЛЕННЫЙ скрипт создания таблиц для ММО-РПГ "Работяги vs Креаклы"
-- Запустите этот скрипт в SQL Editor вашего Supabase проекта

-- Удаляем старые таблицы если есть
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS battles CASCADE; 
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS world_mobs CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Удаляем представления если есть
DROP VIEW IF EXISTS player_full_info CASCADE;
DROP VIEW IF EXISTS active_world_mobs CASCADE;

-- 1. Таблица игроков
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL, -- убрали _hash из названия
    faction VARCHAR(10) NOT NULL CHECK (faction IN ('workers', 'creatives')),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    
    -- Характеристики
    str INTEGER DEFAULT 1,
    end_stat INTEGER DEFAULT 1, -- используем end_stat вместо end (зарезервированное слово)
    dex INTEGER DEFAULT 1,
    int INTEGER DEFAULT 1,
    cha INTEGER DEFAULT 1,
    lck INTEGER DEFAULT 1,
    
    -- Игровая информация
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 100,
    health INTEGER DEFAULT 60,
    
    -- Позиция на карте (15x15)
    x INTEGER DEFAULT 7,
    y INTEGER DEFAULT 7,
    
    -- Статус подключения
    is_online BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Таблица мобов в мире
CREATE TABLE world_mobs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    
    -- Характеристики моба
    max_hp INTEGER NOT NULL,
    current_hp INTEGER NOT NULL,
    base_attack INTEGER NOT NULL,
    base_defense INTEGER NOT NULL,
    base_gold INTEGER NOT NULL,
    
    -- Статус
    is_alive BOOLEAN DEFAULT true,
    respawn_time TIMESTAMP WITH TIME ZONE,
    last_damage_at TIMESTAMP WITH TIME ZONE,
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Таблица сообщений чата
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'global',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Таблица боев
CREATE TABLE battles (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    opponent_type VARCHAR(10) NOT NULL CHECK (opponent_type IN ('player', 'mob')),
    opponent_id BIGINT,
    
    -- Статус боя
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished', 'fled')),
    winner VARCHAR(10) CHECK (winner IN ('player', 'opponent', 'draw')),
    
    -- Статистика боя
    player_damage_dealt INTEGER DEFAULT 0,
    player_damage_taken INTEGER DEFAULT 0,
    exp_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 5. Таблица статистики игроков (ИСПРАВЛЕНО)
CREATE TABLE player_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    
    -- Боевая статистика
    total_battles INTEGER DEFAULT 0,
    battles_won INTEGER DEFAULT 0,
    battles_lost INTEGER DEFAULT 0,
    total_damage_dealt INTEGER DEFAULT 0,
    total_damage_taken INTEGER DEFAULT 0,
    mobs_killed INTEGER DEFAULT 0,
    players_defeated INTEGER DEFAULT 0,
    
    -- Экономическая статистика
    total_gold_earned INTEGER DEFAULT 0,
    total_gold_spent INTEGER DEFAULT 0,
    items_found INTEGER DEFAULT 0,
    
    -- Прогрессия
    total_exp_gained INTEGER DEFAULT 0,
    stat_points_spent INTEGER DEFAULT 0,
    max_level_reached INTEGER DEFAULT 1,
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ТРИГГЕРЫ И ФУНКЦИИ

-- 1. Автоматическая установка характеристик по фракции
CREATE OR REPLACE FUNCTION set_faction_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.faction = 'workers' THEN
        NEW.str = 5;
        NEW.end_stat = 5;
        NEW.dex = 3;
        NEW.int = 1;
        NEW.cha = 1;
        NEW.lck = 3;
        NEW.health = 70; -- (5 + 5) * 7
    ELSIF NEW.faction = 'creatives' THEN
        NEW.str = 2;
        NEW.end_stat = 2;
        NEW.dex = 2;
        NEW.int = 5;
        NEW.cha = 5;
        NEW.lck = 2;
        NEW.health = 28; -- (2 + 2) * 7
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер
CREATE TRIGGER trigger_set_faction_stats
    BEFORE INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION set_faction_stats();

-- 2. Автоматическое создание статистики для нового игрока
CREATE OR REPLACE FUNCTION create_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_stats (player_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер
CREATE TRIGGER trigger_create_player_stats
    AFTER INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION create_player_stats();

-- 3. Обновление времени последнего изменения
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер к таблицам
CREATE TRIGGER trigger_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_world_mobs_updated_at
    BEFORE UPDATE ON world_mobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_player_stats_updated_at
    BEFORE UPDATE ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ПРЕДСТАВЛЕНИЯ (VIEWS)

-- 1. Полная информация об игроках
CREATE VIEW player_full_info AS
SELECT 
    p.id,
    p.nickname,
    p.faction,
    p.gender,
    p.str,
    p.end_stat,
    p.dex,
    p.int,
    p.cha,
    p.lck,
    p.level,
    p.experience,
    p.gold,
    p.health,
    p.x,
    p.y,
    p.is_online,
    p.last_login,
    p.last_activity,
    p.created_at,
    ps.total_battles,
    ps.battles_won,
    ps.battles_lost,
    ps.mobs_killed,
    ps.players_defeated
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id;

-- 2. Активные мобы на карте
CREATE VIEW active_world_mobs AS
SELECT 
    id,
    name,
    x,
    y,
    max_hp,
    current_hp,
    base_attack,
    base_defense,
    base_gold,
    CASE 
        WHEN current_hp <= 0 THEN false
        ELSE is_alive
    END as is_alive,
    CASE 
        WHEN current_hp <= 0 AND respawn_time IS NULL 
        THEN NOW() + INTERVAL '5 minutes'
        ELSE respawn_time
    END as respawn_time
FROM world_mobs;

-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
CREATE INDEX idx_players_nickname ON players(nickname);
CREATE INDEX idx_players_faction ON players(faction);
CREATE INDEX idx_players_online ON players(is_online);
CREATE INDEX idx_players_position ON players(x, y);
CREATE INDEX idx_world_mobs_position ON world_mobs(x, y);
CREATE INDEX idx_world_mobs_alive ON world_mobs(is_alive);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_battles_player_id ON battles(player_id);
CREATE INDEX idx_battles_created_at ON battles(created_at);

-- ЗАПОЛНЕНИЕ СТАРТОВЫМИ ДАННЫМИ

-- Добавляем 10 мобов на карту 15x15
INSERT INTO world_mobs (name, x, y, max_hp, current_hp, base_attack, base_defense, base_gold) VALUES
('Злой Гоблин', 2, 3, 30, 30, 8, 2, 15),
('Дикий Волк', 12, 8, 40, 40, 12, 3, 20),
('Бандит', 5, 14, 50, 50, 15, 5, 25),
('Скелет-воин', 9, 2, 45, 45, 18, 8, 30),
('Орк-берсерк', 14, 12, 70, 70, 25, 10, 45),
('Зомби', 1, 9, 35, 35, 10, 2, 18),
('Паук-охотник', 11, 5, 25, 25, 20, 1, 12),
('Темный маг', 6, 11, 40, 40, 22, 4, 35),
('Разбойник', 13, 1, 55, 55, 16, 6, 28),
('Тролль', 3, 7, 80, 80, 30, 15, 50);

-- ROW LEVEL SECURITY (RLS) ПОЛИТИКИ

-- Включаем RLS для всех таблиц
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_mobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Политики для публичного доступа (анонимные пользователи могут все)
CREATE POLICY "Allow public access" ON players FOR ALL USING (true);
CREATE POLICY "Allow public access" ON world_mobs FOR ALL USING (true);
CREATE POLICY "Allow public access" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow public access" ON battles FOR ALL USING (true);
CREATE POLICY "Allow public access" ON player_stats FOR ALL USING (true);

-- Готово!
NOTIFY users, 'База данных ММО-РПГ "Работяги vs Креаклы" успешно настроена!';
