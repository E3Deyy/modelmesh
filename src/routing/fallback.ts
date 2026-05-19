import { providerRegistry } from '../providers/registry.js'
import { CircuitBreaker } from './circuit-breaker.js'
import type { InferenceRequest, InferenceResponse } from '../providers/types.js'

const circuitBreakers = new Map<string, CircuitBreaker>()
const getCircuitBreaker = (providerName: string): CircuitBreaker => {
  if (!circuitBreakers.has(providerName)) {
    circuitBreakers.set(providerName, new CircuitBreaker(providerName))
  }
  return circuitBreakers.get(providerName)!
}

export const fallbackEngine = {
  async execute(
    request: InferenceRequest,
    preferredProvider?: string
  ): Promise<InferenceResponse & { attempts: number }> {

    const allProviders = providerRegistry.list()
    const orderedProviders = preferredProvider
      ? [preferredProvider, ...allProviders.filter(p => p !== preferredProvider)]
      : allProviders

    const errors: string[] = []
    let attempts = 0

    for (const providerName of orderedProviders) {
      const breaker = getCircuitBreaker(providerName)

      if (!breaker.canRequest()) {
        console.log(`[Fallback] Skipping ${providerName} — circuit OPEN`)
        errors.push(`${providerName}: circuit open`)
        continue
      }
      attempts++

      try {
        console.log(`[Fallback] Attempting provider: ${providerName} (attempt ${attempts})`)
        const provider = providerRegistry.get(providerName)
        const response = await provider.execute(request)

        breaker.onSuccess()

        return { ...response, attempts }

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[Fallback] Provider ${providerName} failed: ${message}`)

        breaker.onFailure()
        errors.push(`${providerName}: ${message}`)

        // later
      }
    }

    throw new Error(
      `All providers failed after ${attempts} attempts. Errors: ${errors.join(' | ')}`
    )
  },

  getCircuitStats() {
    return Array.from(
      providerRegistry.list().map(name => getCircuitBreaker(name).getStats())
    )
  },
}