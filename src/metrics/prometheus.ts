import { Registry, Counter, Histogram, Gauge } from 'prom-client'

export const metricsRegistry = new Registry()
metricsRegistry.setDefaultLabels({ app: 'llm-inference-gateway' })
export const requestsTotal = new Counter ({
    name: 'gateway_requests_total',
    help: 'Total number of inference request',
    labelNames: ['provider', 'status'],
    registers: [metricsRegistry],
})

export const requestDuration = new Histogram({
    name: 'gateway_request_duration_seconds',
    help: 'Inference request duration in seconds',
    labelNames: ['provider'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [metricsRegistry],
})

export const tokensTotal = new Counter({
    name: 'gateway_tokens_total',
    help: 'Total tokens consumed',
    labelNames: ['provider', 'type'],
    registers: [metricsRegistry],
})

export const cacheHitsTotal = new Counter({
    name: 'gateway_cache_hits_total',
    help: 'Total cache hits',
    registers: [metricsRegistry],
})

export const cacheMissesTotal = new Counter({
    name: 'gatewway_cache_misses_total',
    help: 'Total cache misses',
    registers: [metricsRegistry ],
})

export const providerHealthGauge = new Gauge({
    name: 'gateway_provider_healthy',
    help: 'provider health status (1=healthy, 0=unhealthy)',
    labelNames: ['provider'],
    registers: [metricsRegistry],
})