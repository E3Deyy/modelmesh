import { createHash } from 'crypto'
import { redisClient } from './redis.client.js'
import { env } from '../config/env.js'
import type { InferenceRequest, InferenceResponse } from '../providers/types.js'
import { parse } from 'path'

const stats = {
    hits: 0,
    misses: 0,
    errors: 0,
}

export const cacheStats = stats

const buildCacheKey = (request: InferenceRequest): string => {
const payload = JSON.stringify({
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    maxTokens: request.maxTokens ?? 1024,
})
const hash = createHash('sha256').update(payload).digest('hex')
return `gateway:inference:${hash}`
}

export const cacheService = {
    async get(request: InferenceRequest): Promise<InferenceResponse | null> {
        try {
            const key = buildCacheKey(request)
            const cached = await redisClient.get(key)

            if (!cached) {
                stats.misses++
                return null
            }

            stats.hits++
            const parsed = JSON.parse(cached) as InferenceResponse

            return {
                ...parsed,
                provider: `${parsed.provider}: cached`,
                latencyMs: 0,
            }
        } catch (err) {
            stats.errors++
            console.error('[Cache] Get error:', err)
            return null
        }
    },

    async set(request: InferenceRequest, response: InferenceResponse): Promise<void> {
        try {
            const key = buildCacheKey(request)
            const value = JSON.stringify(response)
            await redisClient.set(key, value, 'EX', env.CACHE_TTL_SECONS)
        }   catch (err) {
            stats.errors++
            console.error('[Cache] Set error:', err)
        }
    },

    getStats() {
        const total = stats.hits + stats.misses
        return {
            hits: stats.hits,
            misses: stats.misses,
            errors: stats.errors,
            hitRate: total === 0 ? 0 : Math.round((stats.hits / total) * 100),

        }
    },
}