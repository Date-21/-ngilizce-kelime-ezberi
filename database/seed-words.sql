-- VocabMaster Pro - Ornek Kelimeler (3 Seviye x 10 Kelime)
-- Supabase SQL Editor'de calistirin

-- Seviye 1: Temel Kelimeler
INSERT INTO levels (name, order_index) VALUES ('Temel Kelimeler', 1)
ON CONFLICT (order_index) DO UPDATE SET name = EXCLUDED.name
RETURNING id;

WITH lvl AS (
    SELECT id FROM levels WHERE order_index = 1
)
INSERT INTO words (level_id, english_word, turkish_meaning, pronunciation, memory_sentence, example_sentence) VALUES
(
    (SELECT id FROM lvl), 'abandon', 'terk etmek, birakmak',
    '/əˈbændən/',
    'A BAND''IN ON kisi sahnede sarkiyi TERK ETTI',
    'He abandoned his old car in the parking lot.'
),
(
    (SELECT id FROM lvl), 'benefit', 'fayda, yarar',
    '/ˈbenɪfɪt/',
    'BEN FIT olmaktan cok FAYDA goruyorum',
    'Regular exercise has many benefits for health.'
),
(
    (SELECT id FROM lvl), 'capture', 'yakalamak, ele gecirmek',
    '/ˈkæptʃər/',
    'KAPTAN savas sirasinda dusmani YAKALADI',
    'The police captured the thief after a long chase.'
),
(
    (SELECT id FROM lvl), 'damage', 'hasar, zarar vermek',
    '/ˈdæmɪdʒ/',
    'DAM ustune AGac dustu ve HASAR verdi',
    'The storm caused severe damage to the building.'
),
(
    (SELECT id FROM lvl), 'eager', 'istekli, hevesli',
    '/ˈiːɡər/',
    'IGAR diye bagiran cocuk oynamaya cok ISTEKLI',
    'She was eager to start her new job.'
),
(
    (SELECT id FROM lvl), 'faith', 'inanc, guven',
    '/feɪθ/',
    'FEYZ almak icin INANCA ihtiyacin var',
    'I have faith in your ability to succeed.'
),
(
    (SELECT id FROM lvl), 'gather', 'toplamak, bir araya gelmek',
    '/ˈɡæðər/',
    'GAZ EDER gibi herkesi bir yere TOPLADI',
    'We gathered around the campfire to tell stories.'
),
(
    (SELECT id FROM lvl), 'habit', 'aliskanlik',
    '/ˈhæbɪt/',
    'HER BIT yemek benim ALISKANLIGIM',
    'Reading before bed is a good habit.'
),
(
    (SELECT id FROM lvl), 'ignore', 'gormezden gelmek',
    '/ɪɡˈnɔːr/',
    'IGOR herkesi GORMEZDEN GELIR',
    'Please don''t ignore my messages.'
),
(
    (SELECT id FROM lvl), 'journey', 'yolculuk',
    '/ˈdʒɜːrni/',
    'CERNi ziyaret etmek uzun bir YOLCULUK',
    'The journey from Istanbul to Ankara takes about 5 hours.'
);

-- Seviye 2: Gunluk Yasam
INSERT INTO levels (name, order_index) VALUES ('Gunluk Yasam', 2)
ON CONFLICT (order_index) DO UPDATE SET name = EXCLUDED.name
RETURNING id;

WITH lvl AS (
    SELECT id FROM levels WHERE order_index = 2
)
INSERT INTO words (level_id, english_word, turkish_meaning, pronunciation, memory_sentence, example_sentence) VALUES
(
    (SELECT id FROM lvl), 'knowledge', 'bilgi, bilgisayar',
    '/ˈnɒlɪdʒ/',
    'NO LEGE gerek yok, BILGI yeterli',
    'Knowledge is power in today''s world.'
),
(
    (SELECT id FROM lvl), 'language', 'dil, lisan',
    '/ˈlæŋɡwɪdʒ/',
    'LANG uzun bir DIL gikarir',
    'She speaks three languages fluently.'
),
(
    (SELECT id FROM lvl), 'measure', 'olcmek, olcu',
    '/ˈmeʒər/',
    'MEJER marketteki her seyi OLCER',
    'Can you measure the width of this table?'
),
(
    (SELECT id FROM lvl), 'narrow', 'dar, daraltmak',
    '/ˈnæroʊ/',
    'NAR ROW halinde DAR bir sirada dizilmis',
    'The narrow street was difficult to drive through.'
),
(
    (SELECT id FROM lvl), 'obvious', 'acik, belli, ortada',
    '/ˈɒbviəs/',
    'OBI VAN''in gucu ACIKCA belli',
    'It was obvious that she was lying.'
),
(
    (SELECT id FROM lvl), 'patience', 'sabir',
    '/ˈpeɪʃəns/',
    'PES ETMEYENS SABIR gosterir',
    'Teaching children requires a lot of patience.'
),
(
    (SELECT id FROM lvl), 'quality', 'kalite, nitelik',
    '/ˈkwɒlɪti/',
    'KALE gibi saglam KALITELI malzeme',
    'We always focus on the quality of our products.'
),
(
    (SELECT id FROM lvl), 'realize', 'farkina varmak',
    '/ˈriːəlaɪz/',
    'REEL bir AILE oldugunu FARKEDINCE sasirdi',
    'I didn''t realize how late it was.'
),
(
    (SELECT id FROM lvl), 'schedule', 'program, takvim',
    '/ˈʃedjuːl/',
    'SEV DU ile PROGRAMI planla',
    'My schedule is very busy this week.'
),
(
    (SELECT id FROM lvl), 'temporary', 'gecici',
    '/ˈtempərəri/',
    'TEMPO ARARI GECICI bir mola',
    'This is just a temporary solution.'
);

-- Seviye 3: Is ve Kariyer
INSERT INTO levels (name, order_index) VALUES ('Is ve Kariyer', 3)
ON CONFLICT (order_index) DO UPDATE SET name = EXCLUDED.name
RETURNING id;

WITH lvl AS (
    SELECT id FROM levels WHERE order_index = 3
)
INSERT INTO words (level_id, english_word, turkish_meaning, pronunciation, memory_sentence, example_sentence) VALUES
(
    (SELECT id FROM lvl), 'achieve', 'basarmak, elde etmek',
    '/əˈtʃiːv/',
    'A CEV''iz kirarak hedefe ULASIRSIN',
    'She achieved her goal of becoming a doctor.'
),
(
    (SELECT id FROM lvl), 'negotiate', 'muzakere etmek, pazarlik yapmak',
    '/nɪˈɡoʊʃieɪt/',
    'NEGO''da herkes PAZARLIK yapar',
    'We need to negotiate better terms for the contract.'
),
(
    (SELECT id FROM lvl), 'deadline', 'son teslim tarihi',
    '/ˈdedlaɪn/',
    'DED LINE = OLU CIZGI, gecersen bitersin',
    'The deadline for the project is next Friday.'
),
(
    (SELECT id FROM lvl), 'colleague', 'is arkadasi, meslektas',
    '/ˈkɒliːɡ/',
    'KOLE gibi calisan IS ARKADASIM',
    'My colleague helped me finish the report.'
),
(
    (SELECT id FROM lvl), 'establish', 'kurmak, tesis etmek',
    '/ɪˈstæblɪʃ/',
    'ISTANBUL''da bir sirket KURMAK istiyorum',
    'They established the company in 2010.'
),
(
    (SELECT id FROM lvl), 'promote', 'terfi ettirmek, tanitim yapmak',
    '/prəˈmoʊt/',
    'PRO MOT''la calisan adami TERFI ETTIRDI',
    'She was promoted to senior manager.'
),
(
    (SELECT id FROM lvl), 'strategy', 'strateji, plan',
    '/ˈstrætədʒi/',
    'SIRA TACI giymek icin STRATEJI lazim',
    'We need a new strategy to increase sales.'
),
(
    (SELECT id FROM lvl), 'efficient', 'verimli, etkili',
    '/ɪˈfɪʃənt/',
    'EFE IS ENT''den cok VERIMLI calisiyor',
    'This new system is much more efficient.'
),
(
    (SELECT id FROM lvl), 'investment', 'yatirim',
    '/ɪnˈvestmənt/',
    'IN VEST MENT = ic YELEK AKIL YATIRIMI',
    'Real estate is a good long-term investment.'
),
(
    (SELECT id FROM lvl), 'responsibility', 'sorumluluk',
    '/rɪˌspɒnsəˈbɪlɪti/',
    'RESPONSE ABILITY = CEVAP VERME YETENEGI = SORUMLULUK',
    'Taking responsibility for your actions is important.'
);

-- Ozet
SELECT l.name AS seviye, l.order_index AS sira, COUNT(w.id) AS kelime_sayisi
FROM levels l
LEFT JOIN words w ON w.level_id = l.id
GROUP BY l.id, l.name, l.order_index
ORDER BY l.order_index;
