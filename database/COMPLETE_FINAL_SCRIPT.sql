-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ ММО-РПГ "Работяги vs Креаклы"
-- 100% СООТВЕТСТВУЕТ КОДУ ПРОЕКТА
-- Выполни этот скрипт в Supabase SQL Editor

-- Очистка: удаляем все старые объекты
DROP FUNCTION IF EXISTS set_faction_stats CASCADE;
DROP FUNCTION IF EXISTS set_faction_stats_simple CASCADE;
DROP FUNCTION IF EXISTS create_player_stats CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_player_stats CASCADE;

DROP VIEW IF EXISTS player_full_info CASCADE;
DROP VIEW IF EXISTS active_world_mobs CASCADE;

DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS world_mobs CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- 1. ТАБЛИЦА ИГРОКОВ (точно как в коде)
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    password TEXT,                      -- БЕЗ _hash! Как в коде
    faction TEXT DEFAULT 'workers',     -- workers | creatives
    gender TEXT DEFAULT 'male',         -- male | female
    
    -- Характеристики (как в коде)
    str INTEGER DEFAULT 5,
    end_stat INTEGER DEFAULT 5,         -- end_stat (не end!)
    dex INTEGER DEFAULT 3,
    int INTEGER DEFAULT 1,
    cha INTEGER DEFAULT 1,
    lck INTEGER DEFAULT 3,
    
    -- Игровая информация
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 100,
    health INTEGER DEFAULT 70,
    
    -- Позиция на карте 15x15 (как в коде)
    x INTEGER DEFAULT 7,
    y INTEGER DEFAULT 7,
    
    -- Статус онлайн (как в коде)
    is_online BOOLEAN DEFAULT false,
    
    -- Временные метки
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. ТАБЛИЦА МОБОВ В МИРЕ (точно как в коде)
CREATE TABLE world_mobs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT DEFAULT 'Моб',
    x INTEGER DEFAULT 5,
    y INTEGER DEFAULT 5,
    
    -- Характеристики моба (как в коде)
    max_hp INTEGER DEFAULT 50,
    current_hp INTEGER DEFAULT 50,
    base_attack INTEGER DEFAULT 15,
    base_defense INTEGER DEFAULT 5,
    base_gold INTEGER DEFAULT 25,
    
    -- Статус (как в коде)
    is_alive BOOLEAN DEFAULT true,
    
    -- Временные метки
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. ТАБЛИЦА ЧАТА (как в коде)
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    channel TEXT DEFAULT 'global',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ТАБЛИЦА БОЕВ (для будущего расширения)
CREATE TABLE battles (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    opponent_type TEXT DEFAULT 'mob',   -- 'player' | 'mob'
    opponent_id BIGINT,
    
    -- Статус боя
    status TEXT DEFAULT 'active',       -- 'active' | 'finished' | 'fled'
    winner TEXT,                        -- 'player' | 'opponent' | 'draw'
    
    -- Статистика боя
    player_damage_dealt INTEGER DEFAULT 0,
    player_damage_taken INTEGER DEFAULT 0,
    exp_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    
    -- Временные метки
    created_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- 5. ТАБЛИЦА СТАТИСТИКИ ИГРОКОВ (для будущего расширения)
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
    
    -- Прогрессия
    total_exp_gained INTEGER DEFAULT 0,
    stat_points_spent INTEGER DEFAULT 0,
    max_level_reached INTEGER DEFAULT 1,
    
    -- Временные метки
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ТРИГГЕРЫ И ФУНКЦИИ

-- 1. Автоматическая установка характеристик фракции (СООТВЕТСТВУЕТ КОДУ)
CREATE OR REPLACE FUNCTION set_faction_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.faction = 'workers' THEN
        -- Работяги: STR=5, END=5, DEX=3, INT=1, CHA=1, LCK=3
        NEW.str = 5;
        NEW.end_stat = 5;           -- end_stat!
        NEW.dex = 3;
        NEW.int = 1;
        NEW.cha = 1;
        NEW.lck = 3;
        NEW.health = 70;            -- (5 + 5) * 7
    ELSIF NEW.faction = 'creatives' THEN
        -- Креаклы: STR=2, END=2, DEX=2, INT=5, CHA=5, LCK=2
        NEW.str = 2;
        NEW.end_stat = 2;           -- end_stat!
        NEW.dex = 2;
        NEW.int = 5;
        NEW.cha = 5;
        NEW.lck = 2;
        NEW.health = 28;            -- (2 + 2) * 7
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер для фракций
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

-- Применяем триггер для статистики
CREATE TRIGGER trigger_create_player_stats
    AFTER INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION create_player_stats();

-- 3. Обновление updated_at при изменении записей
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггеры обновления времени
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

-- 1. Полная информация об игроках (для дебага)
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
    p.created_at,
    ps.total_battles,
    ps.battles_won,
    ps.battles_lost,
    ps.mobs_killed,
    ps.players_defeated
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id;

-- 2. Активные мобы на карте (для UI)
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
    is_alive
FROM world_mobs
WHERE is_alive = true;

-- НАСТРОЙКА RLS (Row Level Security)

-- ПОЛНОСТЬЮ ОТКЛЮЧАЕМ RLS для анонимного доступа
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE world_mobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE battles DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;

-- МАКСИМАЛЬНЫЕ ПРАВА для anon роли
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- ИНДЕКСЫ для производительности
CREATE INDEX idx_players_nickname ON players(nickname);
CREATE INDEX idx_players_faction ON players(faction);
CREATE INDEX idx_players_online ON players(is_online);
CREATE INDEX idx_players_position ON players(x, y);
CREATE INDEX idx_world_mobs_position ON world_mobs(x, y);
CREATE INDEX idx_world_mobs_alive ON world_mobs(is_alive);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_battles_player_id ON battles(player_id);

-- СТАРТОВЫЕ ДАННЫЕ

-- Добавляем 10 мобов на карту 15x15 (как в коде)
INSERT INTO world_mobs (name, x, y, max_hp, current_hp, base_attack, base_defense, base_gold, is_alive) VALUES
('Злой Гоблин', 2, 3, 30, 30, 8, 2, 15, true),
('Дикий Волк', 12, 8, 40, 40, 12, 3, 20, true),
('Бандит', 5, 14, 50, 50, 15, 5, 25, true),
('Скелет-воин', 9, 2, 45, 45, 18, 8, 30, true),
('Орк-берсерк', 14, 12, 70, 70, 25, 10, 45, true),
('Зомби', 1, 9, 35, 35, 10, 2, 18, true),
('Паук-охотник', 11, 5, 25, 25, 20, 1, 12, true),
('Темный маг', 6, 11, 40, 40, 22, 4, 35, true),
('Разбойник', 13, 1, 55, 55, 16, 6, 28, true),
('Тролль', 3, 7, 80, 80, 30, 15, 50, true);

-- ТЕСТИРОВАНИЕ

-- Тест регистрации игрока
INSERT INTO players (nickname, password, faction, gender) 
VALUES ('test123', '123', 'workers', 'male')
ON CONFLICT (nickname) DO NOTHING
RETURNING id, nickname, 'SUCCESS' as status;

-- Проверяем что все создалось правильно
SELECT 'players' as table_name, COUNT(*) as count FROM players
UNION ALL
SELECT 'world_mobs' as table_name, COUNT(*) as count FROM world_mobs
UNION ALL
SELECT 'chat_messages' as table_name, COUNT(*) as count FROM chat_messages
UNION ALL
SELECT 'battles' as table_name, COUNT(*) as count FROM battles
UNION ALL
SELECT 'player_stats' as table_name, COUNT(*) as count FROM player_stats;

-- Показываем созданного тестового игрока
SELECT id, nickname, faction, gender, str, end_stat, dex, int, cha, lck, health, x, y 
FROM players 
WHERE nickname = 'test123';

-- Готово! База данных полностью соответствует коду проекта
SELECT 'DATABASE_SETUP_COMPLETE' as status, NOW() as timestamp;
