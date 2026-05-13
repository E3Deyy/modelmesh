import { providerRegistry } from '../providers/registry.js'
import { cacheService } from '../cache/cache.service.js'
import {
  requestsTotal,
  requestDuration,
  tokensTotal,
  cacheHitsTotal,
  cacheMissesTotal,
} from '../metrics/prometheus.js'
import type { InferenceRequest, InferenceResponse } from '../providers/types.js'

export class InferenceService {
  async infer(
    request: InferenceRequest,
    providerName?: string
  ): Promise<InferenceResponse> {

    const cached = await cacheService.get(request)
    if (cached) {
      // cache hit Prometheus
      cacheHitsTotal.inc()
      requestsTotal.inc({ provider: 'cache', status: 'cache_hit' })
      console.log('[InferenceService] Cache HIT')
      return cached
    }
    cacheMissesTotal.inc()
    const name = providerName ?? providerRegistry.list()[0]
    if (!name) throw new Error('No providers registered')

    const provider = providerRegistry.get(name)
    const timer = requestDuration.startTimer({ provider: name })

    try {
      const response = await provider.execute(request)
      timer()
      tokensTotal.inc(
        { provider: name, type: 'prompt' },
        response.usage.promptTokens
      )
      tokensTotal.inc(
        { provider: name, type: 'completion' },
        response.usage.completionTokens
      )

      requestsTotal.inc({ provider: name, status: 'success' })

      void cacheService.set(request, response)

      console.log(`[InferenceService] ${name} responded in ${response.latencyMs}ms`)

      return response
    } catch (err) {
      timer()
      requestsTotal.inc({ provider: name, status: 'error' })
      throw err
    }
  }
}

export const inferenceService = new InferenceService()