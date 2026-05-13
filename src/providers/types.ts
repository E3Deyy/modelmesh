export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content:string
}

export interface InferenceRequest {
    messages: ChatMessage []
    temperature?: number
    maxTokens?: number
    stream?: boolean
}

export interface InferenceResponse {
    id: string
    content: string
    model: string
    provider: string
    usage: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    latencyMs: number
}
 export interface ProviderHealth {
    healthy: boolean
    latencyMs?: number
    error?: string
 }

 //Contrato
 export interface IProvider {
    readonly name: string
    execute(request: InferenceRequest): Promise<InferenceResponse>
    healthCheck(): Promise <ProviderHealth>
 }