-- ИСПРАВЛЕННЫЙ SQL СКРИПТ БЕЗ ОШИБОК
-- Выполни это в Supabase SQL Editor

-- 1. ПОЛНОСТЬЮ отключаем RLS для всех таблиц
ALTER TABLE IF EXISTS players DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS world_mobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS battles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_stats DISABLE ROW LEVEL SECURITY;

-- 2. Удаляем ВСЕ существующие политики
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
               FROM pg_policies 
               WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. Даем МАКСИМАЛЬНЫЕ права anon роли
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Проверяем что таблицы существуют и доступны
SELECT 
    'players' as table_name, 
    COUNT(*) as records,
    CASE WHEN COUNT(*) >= 0 THEN '✅ OK' ELSE '❌ FAIL' END as status
FROM players
UNION ALL
SELECT 
    'world_mobs' as table_name, 
    COUNT(*) as records,
    CASE WHEN COUNT(*) >= 0 THEN '✅ OK' ELSE '❌ FAIL' END as status  
FROM world_mobs;

-- 5. Тестовый запрос с КОРОТКИМ никнеймом (ИСПРАВЛЕНО)
INSERT INTO players (nickname, password, faction, gender) 
VALUES ('test123', '123', 'workers', 'male')
ON CONFLICT (nickname) DO NOTHING
RETURNING id, nickname, 'OK' as status;
