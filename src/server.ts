import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = buildApp()

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    app.log.info(`Gateway running on port ${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown — esto es lo que hace que el servidor sea seguro en Docker/K8s
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`)
  await app.close()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start()