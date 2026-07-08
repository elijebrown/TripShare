import { Pool } from 'pg'

export const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
})

const snakeToCamel = (str: string) =>
    str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())

export const queryRows = async <T>(
    text: string,
    params?: unknown[]
): Promise<T[]> => {
    const result = await pool.query(text, params)
    return result.rows.map(
        (row) =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    snakeToCamel(key),
                    value,
                ])
            ) as T
    )
}
