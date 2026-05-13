import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']),

    LMSTUDIO_BASE_URL: z.string().url(),
    LMSTUDIO_MODEL: z.string().min(1),

    REDIS_URL:z.string().url().default('redis://localhost:6379'),
    CACHE_TTL_SECONS: z.coerce.number().default(300), 
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('Invalid enviroment variables:')
    console.error(parsed.error?.flatten().fieldErrors)
    process.exit(1)
}

export const env = parsed.data
export type Env = typeof parsed.data