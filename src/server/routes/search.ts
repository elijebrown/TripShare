import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { queryRows } from '../db'
import * as sql from '../sql/statements'
import type {
    CitySearchResult,
    CountrySearchResult,
    MemorySearchResult,
    ProvinceSearchResult,
    SearchResult,
    TripSearchResult,
} from '../../shared/types'

// Normalizes ?search= to a single string ('' when absent), matching the
// legacy behavior of `req.query.search || ''`.
const searchQuery = validator('query', (value) => {
    const raw = Array.isArray(value.search) ? value.search[0] : value.search
    return { search: typeof raw === 'string' ? raw : '' }
})

export const searchRoutes = new Hono()
    .get('/searchAll', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(await queryRows<SearchResult>(sql.searchAll, [search]))
    })
    .get('/citySearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<CitySearchResult>(sql.citySearch, [search])
        )
    })
    .get('/provinceSearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<ProvinceSearchResult>(sql.provinceSearch, [search])
        )
    })
    .get('/countrySearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<CountrySearchResult>(sql.countrySearch, [search])
        )
    })
    .get('/tripSearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<TripSearchResult>(sql.tripSearch, [search])
        )
    })
    .get('/memorySearch', searchQuery, async (c) => {
        const { search } = c.req.valid('query')
        return c.json(
            await queryRows<MemorySearchResult>(sql.memorySearch, [search])
        )
    })
