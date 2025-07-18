-- ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ SQL СКРИПТ
-- Выполни это в Supabase SQL Editor

-- Удаляем все триггеры и функции
DROP FUNCTION IF EXISTS set_faction_stats CASCADE;
DROP FUNCTION IF EXISTS set_faction_stats_simple CASCADE;
DROP FUNCTION IF EXISTS create_player_stats CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- Пересоздаем таблицу players с правильной структурой
DROP TABLE IF EXISTS players CASCADE;

CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    password TEXT,
    faction TEXT DEFAULT 'workers',
    gender TEXT DEFAULT 'male',
    str INTEGER DEFAULT 5,
    end_stat INTEGER DEFAULT 5,
    dex INTEGER DEFAULT 3,
    int INTEGER DEFAULT 1,
    cha INTEGER DEFAULT 1,
    lck INTEGER DEFAULT 3,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 100,
    health INTEGER DEFAULT 70,
    x INTEGER DEFAULT 7,
    y INTEGER DEFAULT 7,
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Пересоздаем таблицу мобов БЕЗ NOT NULL constraint проблем
DROP TABLE IF EXISTS world_mobs CASCADE;

CREATE TABLE world_mobs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT DEFAULT 'Моб',
    x INTEGER DEFAULT 5,
    y INTEGER DEFAULT 5,
    max_hp INTEGER DEFAULT 50,
    current_hp INTEGER DEFAULT 50,
    base_attack INTEGER DEFAULT 15,
    base_defense INTEGER DEFAULT 5,
    base_gold INTEGER DEFAULT 25,
    is_alive BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создаем простой триггер для фракций
CREATE OR REPLACE FUNCTION set_faction_stats_simple()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.faction = 'workers' THEN
        NEW.str = 5; NEW.end_stat = 5; NEW.dex = 3; 
        NEW.int = 1; NEW.cha = 1; NEW.lck = 3;
        NEW.health = 70;
    ELSIF NEW.faction = 'creatives' THEN
        NEW.str = 2; NEW.end_stat = 2; NEW.dex = 2; 
        NEW.int = 5; NEW.cha = 5; NEW.lck = 2;
        NEW.health = 28;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_faction_stats_simple
    BEFORE INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION set_faction_stats_simple();

-- ПОЛНОСТЬЮ отключаем RLS
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE world_mobs DISABLE ROW LEVEL SECURITY;

-- Максимальные права для anon
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Вставляем тестовых мобов С ПРАВИЛЬНЫМИ ДАННЫМИ
INSERT INTO world_mobs (name, x, y, max_hp, current_hp, base_attack, base_defense, base_gold, is_alive) VALUES 
('Гоблин', 2, 3, 30, 30, 8, 2, 15, true),
('Волк', 12, 8, 40, 40, 12, 3, 20, true),
('Бандит', 5, 14, 50, 50, 15, 5, 25, true);

-- Тест регистрации
INSERT INTO players (nickname, password, faction, gender) 
VALUES ('test123', '123', 'workers', 'male')
ON CONFLICT (nickname) DO NOTHING
RETURNING id, nickname, 'SUCCESS' as status;

-- Проверяем что все создалось
SELECT 'players' as table_name, COUNT(*) as count FROM players
UNION ALL
SELECT 'world_mobs' as table_name, COUNT(*) as count FROM world_mobs;
