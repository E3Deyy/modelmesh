import type { IProvider } from "./types.js";

class ProviderRegistry {
    private readonly providers = new Map<string, IProvider>

    register(provider: IProvider): void {
        if (this.providers.has(provider.name)) {
            throw new Error(`Provider "${provider.name}" is already registered`)
        }
        this.providers.set(provider.name, provider)
        console.log(`[Registry] Provider registered: ${provider.name}`)
    }

    get(name: string): IProvider {
        const provider = this.providers.get(name)
        if (!provider) {
            throw new Error(`Provider "${name}" not found. Registered: ${this.list().join(', ')}`)
        }
        return provider
    }

    list(): string[] {
        return Array.from(this.providers.keys())
    }

    async healthCheckAll(): Promise<Record<string, { healthy: boolean; latencyMs?: number; error?: string }>>{
        const results: Record<string, { healthy: boolean; latencyMs?: number; error?: string }> = {}

        await Promise.allSettled(
            Array.from(this.providers.entries()).map(async ([name, provider]) => {
                
            })
        )

        return results
    }
}


export const providerRegistry = new ProviderRegistry()