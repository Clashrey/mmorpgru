-- Скрипт создания таблиц для ММО-РПГ "Работяги vs Креаклы"
-- Запустите этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Таблица игроков
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS world_mobs (
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
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'global',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Таблица боев
CREATE TABLE IF NOT EXISTS battles (
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

-- 5. Таблица статистики игроков
CREATE TABLE IF NOT EXISTS player_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE UNIQUE,
    
    -- Боевая статистика
    battles_won INTEGER DEFAULT 0,
    battles_lost INTEGER DEFAULT 0,
    total_damage_dealt INTEGER DEFAULT 0,
    total_damage_taken INTEGER DEFAULT 0,
    
    -- Экономическая статистика
    total_gold_earned INTEGER DEFAULT 0,
    total_gold_spent INTEGER DEFAULT 0,
    
    -- Социальная статистика
    messages_sent INTEGER DEFAULT 0,
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Представление с полной информацией об игроках
CREATE OR REPLACE VIEW player_full_info AS
SELECT 
    p.*,
    ps.battles_won,
    ps.battles_lost,
    ps.total_damage_dealt,
    ps.total_damage_taken,
    ps.total_gold_earned,
    ps.total_gold_spent,
    ps.messages_sent,
    CASE 
        WHEN p.last_activity > NOW() - INTERVAL '5 minutes' THEN true 
        ELSE false 
    END as is_recently_active
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id;

-- 7. Представление с активными мобами
CREATE OR REPLACE VIEW active_world_mobs AS
SELECT * FROM world_mobs 
WHERE is_alive = true 
AND (respawn_time IS NULL OR respawn_time <= NOW());

-- 8. Функция для обновления статистики игрока
CREATE OR REPLACE FUNCTION update_player_stats(
    p_player_id BIGINT,
    p_battle_won BOOLEAN DEFAULT NULL,
    p_damage_dealt INTEGER DEFAULT 0,
    p_damage_taken INTEGER DEFAULT 0,
    p_gold_earned INTEGER DEFAULT 0,
    p_gold_spent INTEGER DEFAULT 0,
    p_messages_sent INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO player_stats (player_id, battles_won, battles_lost, total_damage_dealt, 
                              total_damage_taken, total_gold_earned, total_gold_spent, messages_sent)
    VALUES (p_player_id, 
            CASE WHEN p_battle_won = true THEN 1 ELSE 0 END,
            CASE WHEN p_battle_won = false THEN 1 ELSE 0 END,
            p_damage_dealt, p_damage_taken, p_gold_earned, p_gold_spent, p_messages_sent)
    ON CONFLICT (player_id) 
    DO UPDATE SET
        battles_won = player_stats.battles_won + CASE WHEN p_battle_won = true THEN 1 ELSE 0 END,
        battles_lost = player_stats.battles_lost + CASE WHEN p_battle_won = false THEN 1 ELSE 0 END,
        total_damage_dealt = player_stats.total_damage_dealt + p_damage_dealt,
        total_damage_taken = player_stats.total_damage_taken + p_damage_taken,
        total_gold_earned = player_stats.total_gold_earned + p_gold_earned,
        total_gold_spent = player_stats.total_gold_spent + p_gold_spent,
        messages_sent = player_stats.messages_sent + p_messages_sent,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггеры
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_world_mobs_updated_at ON world_mobs;
CREATE TRIGGER update_world_mobs_updated_at BEFORE UPDATE ON world_mobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Создание стартовых мобов (пример)
INSERT INTO world_mobs (name, x, y, max_hp, current_hp, base_attack, base_defense, base_gold) VALUES
('Злой Гоблин', 2, 3, 40, 40, 8, 2, 50),
('Дикий Волк', 5, 8, 60, 60, 12, 3, 75),
('Скелет-воин', 12, 5, 50, 50, 10, 4, 60),
('Орк-берсерк', 1, 12, 80, 80, 15, 5, 100),
('Темный маг', 14, 2, 45, 45, 18, 1, 90),
('Разбойник', 8, 11, 55, 55, 11, 3, 65),
('Паук-охотник', 10, 1, 35, 35, 9, 2, 45),
('Тролль', 3, 14, 100, 100, 20, 8, 150),
('Зомби', 13, 9, 70, 70, 7, 6, 55),
('Бандит', 6, 6, 48, 48, 9, 3, 70)
ON CONFLICT DO NOTHING;

-- 11. Настройка Row Level Security (опционально)
-- Включаем RLS для безопасности
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (все пользователи могут читать общедоступную информацию)
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Players can update own data" ON players FOR UPDATE USING (true);
CREATE POLICY "Players can insert own data" ON players FOR INSERT WITH CHECK (true);

CREATE POLICY "Chat messages are viewable by everyone" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Players can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Battles are viewable by everyone" ON battles FOR SELECT USING (true);
CREATE POLICY "Players can insert battles" ON battles FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update own battles" ON battles FOR UPDATE USING (true);

CREATE POLICY "Player stats are viewable by everyone" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Player stats can be updated" ON player_stats FOR ALL USING (true);

-- 12. Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_players_nickname ON players(nickname);
CREATE INDEX IF NOT EXISTS idx_players_faction ON players(faction);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(x, y);
CREATE INDEX IF NOT EXISTS idx_players_online ON players(is_online, last_activity);

CREATE INDEX IF NOT EXISTS idx_world_mobs_position ON world_mobs(x, y);
CREATE INDEX IF NOT EXISTS idx_world_mobs_alive ON world_mobs(is_alive);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_player_id ON chat_messages(player_id);

CREATE INDEX IF NOT EXISTS idx_battles_player_id ON battles(player_id);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON battles(created_at);

-- Готово! 
-- Теперь ваша база данных готова для работы с ММО-РПГ
SELECT 'База данных ММО-РПГ "Работяги vs Креаклы" успешно настроена!' as message;
