import type { IProvider, InferenceRequest, InferenceResponse, ProviderHealth } from '../types.js'
import { env } from '../../config/env.js'

interface LMStudioResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class LMStudioProvider implements IProvider {
  readonly name = 'lmstudio'
  private readonly baseUrl: string
  private readonly model: string

  constructor() {
    this.baseUrl = env.LMSTUDIO_BASE_URL
    this.model = env.LMSTUDIO_MODEL
  }

  async execute(request: InferenceRequest): Promise<InferenceResponse> {
    const start = Date.now()

    const body = {
      model: this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1024,
      stream: false,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Timeout de 30 s para el LLM
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LMStudio error ${response.status}: ${error}`)
    }

    const data = (await response.json()) as LMStudioResponse
    const latencyMs = Date.now() - start

    // RTA al formato interno del gateway
    return {
      id: data.id,
      content: data.choices[0]?.message.content ?? '',
      model: data.model,
      provider: this.name,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      latencyMs,
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(5_000),
      })
      if (!response.ok) {
        return { healthy: false, error: `HTTP ${response.status}` }
      }
      return { healthy: true, latencyMs: Date.now() - start }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { healthy: false, error: message }
    }
  }
}