import { app } from './app'

const server = Bun.serve({
	port: Number(process.env.SERVER_PORT ?? 3000),
	fetch: app.fetch,
})

console.log(`TripShare API running on ${server.url}`)
