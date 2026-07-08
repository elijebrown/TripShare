// All queries use prepared-statement params ($1). Migrated from the legacy
// backend. The BM25 indexes use 1-3 char prefix-ngram tokenizers;
// paradedb.match() tokenizes the query with the field's tokenizer, which
// reproduces the legacy search-as-you-type behavior on pg_search 0.24+
// (fuzzy_phrase no longer exists, and GROUP BY + paradedb.score() crashes,
// hence DISTINCT). memorySearch is also fixed here (the original selected
// `m.id AS *`, a syntax error).

export const citySearch = `
    SELECT DISTINCT c.city_name, c.id, paradedb.score(c.id) AS score
FROM cities c
JOIN photos p ON p.city_id = c.id
WHERE c.city_name @@@ paradedb.match('city_name', $1)
ORDER BY score DESC
LIMIT 3
`

export const provinceSearch = `
 SELECT DISTINCT provinces.province_name, provinces.id, paradedb.score(provinces.id) AS score
FROM provinces
JOIN cities c ON provinces.id = c.province_id
JOIN photos ON photos.city_id = c.id
WHERE provinces.province_name @@@ paradedb.match('province_name', $1)
ORDER BY score DESC
LIMIT 3
`

export const countrySearch = `
    SELECT DISTINCT co.id, country_id, co.country_name, paradedb.score(co.id) AS score
FROM countries co
JOIN provinces p ON co.id = p.country_id
JOIN cities c ON p.id = c.province_id
JOIN photos ph ON c.id = ph.city_id
WHERE co.country_name @@@ paradedb.match('country_name', $1)
ORDER BY score DESC
LIMIT 3
`

export const tripSearch = `
    SELECT DISTINCT t.id, t.trip_name, t.trip_date, t.trip_text, paradedb.score(t.id) AS score
FROM trips t
WHERE t.trip_name @@@ paradedb.match('trip_name', $1)
    ORDER BY score DESC
    LIMIT 1
`

export const memorySearch = `
    SELECT DISTINCT m.id, m.trip_id, m.memory_title, m.memory_text, paradedb.score(m.id) AS score
FROM memories m
WHERE m.memory_title @@@ paradedb.match('memory_title', $1)
ORDER BY score DESC
LIMIT 3
`

export const tripPhotos = `
    WITH photo_ids AS (
        SELECT photo_id FROM trip_photos WHERE trip_id = $1
    )
    SELECT p.* FROM photos p JOIN photo_ids i ON p.id = i.photo_id
`

export const searchAll = `
  WITH
visited_cities AS (
    SELECT DISTINCT
        c.id AS id,
        c.city_name AS name,
        'city' AS type,
        paradedb.score(c.id) AS score
    FROM cities c
    JOIN photos p ON p.city_id = c.id
    WHERE c.city_name @@@ paradedb.match('city_name', $1)
    ORDER BY score DESC
    LIMIT 3
),
visited_provinces AS (
    SELECT DISTINCT
        provinces.id AS id,
        provinces.province_name AS name,
        'province' AS type,
        paradedb.score(provinces.id) AS score
    FROM provinces
    JOIN cities c ON provinces.id = c.province_id
    JOIN photos ph ON ph.city_id = c.id
    WHERE provinces.province_name @@@ paradedb.match('province_name', $1)
    ORDER BY score DESC
    LIMIT 3
),
visited_countries AS (
    SELECT DISTINCT
        co.id AS id,
        co.country_name AS name,
        'country' AS type,
        paradedb.score(co.id) AS score
    FROM countries co
    JOIN provinces p ON co.id = p.country_id
    JOIN cities c ON p.id = c.province_id
    JOIN photos ph ON c.id = ph.city_id
    WHERE co.country_name @@@ paradedb.match('country_name', $1)
    ORDER BY score DESC
    LIMIT 3
),
trip_similarity AS (
    SELECT
        t.id AS id,
        t.trip_name AS name,
        'trip' AS type,
        paradedb.score(t.id) AS score
    FROM trips t
    WHERE t.trip_name @@@ paradedb.match('trip_name', $1)
    ORDER BY score DESC
    LIMIT 1
),
memory_similarity AS (
    SELECT DISTINCT
        m.id AS id,
        m.memory_title AS name,
        'memory' AS type,
        paradedb.score(m.id) AS score
    FROM memories m
    WHERE m.memory_title @@@ paradedb.match('memory_title', $1)
    ORDER BY score DESC
    LIMIT 3
)
SELECT * FROM visited_cities
UNION ALL
SELECT * FROM visited_provinces
UNION ALL
SELECT * FROM visited_countries
UNION ALL
SELECT * FROM trip_similarity
UNION ALL
SELECT * FROM memory_similarity
ORDER BY score DESC
`

// Explicit getter queries (replaces the runtime information_schema route
// generation from the old fetchTableNames.ts).
export const allTrips = `SELECT * FROM trips`
export const allMemories = `SELECT * FROM memories`
export const allPhotos = `SELECT * FROM photos`
export const allCities = `SELECT * FROM cities`
export const allProvinces = `SELECT * FROM provinces`
export const allCountries = `SELECT * FROM countries`
