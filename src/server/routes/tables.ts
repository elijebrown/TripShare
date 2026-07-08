import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { HTTPException } from 'hono/http-exception'
import { queryRows } from '../db'
import * as sql from '../sql/statements'
import type {
    City,
    Country,
    Memory,
    Photo,
    Province,
    Trip,
} from '../../shared/types'

const tripIdQuery = validator('query', (value) => {
    const raw = Array.isArray(value.tripId) ? value.tripId[0] : value.tripId
    if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) {
        throw new HTTPException(400, {
            message: 'tripId must be a positive integer',
        })
    }
    return { tripId: raw }
})

export const tableRoutes = new Hono()
    .get('/trips', async (c) => c.json(await queryRows<Trip>(sql.allTrips)))
    .get('/memories', async (c) =>
        c.json(await queryRows<Memory>(sql.allMemories))
    )
    .get('/photos', async (c) => c.json(await queryRows<Photo>(sql.allPhotos)))
    .get('/cities', async (c) => c.json(await queryRows<City>(sql.allCities)))
    .get('/provinces', async (c) =>
        c.json(await queryRows<Province>(sql.allProvinces))
    )
    .get('/countries', async (c) =>
        c.json(await queryRows<Country>(sql.allCountries))
    )
    .get('/tripPhotos', tripIdQuery, async (c) => {
        const { tripId } = c.req.valid('query')
        return c.json(await queryRows<Photo>(sql.tripPhotos, [Number(tripId)]))
    })
