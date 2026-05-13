import Redis from 'ioredis'
import { env } from '../config/env.js'

const createRedisClient = () => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null
      return times * 200
    },
    lazyConnect: true,
  })
  client.on('connect', () => {
    console.log('[Redis] Connected')
  })
  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })

  return client
}

export const redisClient = createRedisClient()