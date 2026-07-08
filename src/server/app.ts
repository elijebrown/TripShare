import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { searchRoutes } from './routes/search'
import { tableRoutes } from './routes/tables'

export const app = new Hono()
	.use(logger())
	.route('/', searchRoutes)
	.route('/', tableRoutes)

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json({ error: err.message }, err.status)
	}
	console.error(err)
	return c.json({ error: 'Internal server error' }, 500)
})

export type AppType = typeof app
