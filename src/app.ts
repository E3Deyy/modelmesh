import Fastify from 'fastify'
import { env } from './config/env.js'
import { providerRegistry } from './providers/registry.js'
import { LMStudioProvider } from './providers/lmstudio/lmstudio.provider.js'
import { inferenceService } from './services/inference.service.js'
import type { InferenceRequest } from './providers/types.js'
import { cacheService } from './cache/cache.service.js'
import { metricsRegistry } from './metrics/prometheus.js'
import { providerHealthGauge } from './metrics/prometheus.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  // Registrar providers
  providerRegistry.register(new LMStudioProvider())

 app.get('/health', async (_req, reply) => {
  const providers = await providerRegistry.healthCheckAll()

  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    providers,
    cache: cacheService.getStats(),
  })
})

  // Inference
  app.post('/v1/chat/completions', async (request, reply) => {
    const body = request.body as {
      messages: InferenceRequest['messages']
      temperature?: number
      max_tokens?: number
      provider?: string
    }

    if (!body.messages || !Array.isArray(body.messages)) {
      return reply.status(400).send({ error: 'messages array is required' })
    }

    const result = await inferenceService.infer(
      {
        messages: body.messages,
        temperature: body.temperature,
        maxTokens: body.max_tokens,
      },
      body.provider
    )

    // Devolvemos compatible con openai cualquier SDK
    return reply.send({
      id: result.id,
      object: 'chat.completion',
      model: result.model,
      provider: result.provider,
      latency_ms: result.latencyMs,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: result.content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
      },
    })
  })
  app.get('/metrics', async (_req, reply) => {
    const healthResults = await providerRegistry.healthCheckAll()
    for (const [name, result] of Object.entries(healthResults)){
      providerHealthGauge.set({ provider: name}, result.healthy ? 1 :0)
    }
    const metrics = await metricsRegistry.metrics()
    return reply
      .header('Content-Type', metricsRegistry.contentType)
      .send(metrics)
  })
  return app
}
