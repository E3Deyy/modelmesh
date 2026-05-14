type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerOptions {
    failureThreshold: number
    recoveryTimeMs: number
}

export class CircuitBreaker {
    private state: CircuitState = 'CLOSED'
    private failures = 0
    private lastFailureTime?: number
    private readonly options: CircuitBreakerOptions

    constructor(
        private readonly providerName: string,
        options?: Partial<CircuitBreakerOptions>
    ) {
        this.options = {
            failureThreshold: options?.failureThreshold ?? 3,
            recoveryTimeMs: options?.recoveryTimeMs ?? 30_000,
        }
    }

    canRequest(): boolean {
        if (this.state === 'CLOSED') return true

        if (this.state === 'OPEN') {
            const timeSinceFailure = Date.now() - (this.lastFailureTime ?? 0)

            if(timeSinceFailure >= this.options.recoveryTimeMs) {
                this.state = 'HALF_OPEN'
                console.log(`[CircuitBreaker] ${this.providerName}: OPEN -> HALF_OPEN`)
                return true
            }

            return false
        }
        return true //half open
    }

    onSuccess(): void {
        if (this.state === 'HALF_OPEN') {
            console.log(`[CircuitBreaker] ${this.providerName}: HALF_OPEN -> CLOSED`)
        }
        this.state = 'CLOSED'
        this.failures = 0
    }

    onFailure(): void {
        this.failures++
        this.lastFailureTime = Date.now()

        if (this.failures >= this.options.failureThreshold) {
            this.state = 'OPEN'
            console.log(
                `[CircuitBreaker] ${this.providerName}: CLOSED -> OPEN`+
                `(${this.failures} failures, recovery in ${this.options.recoveryTimeMs}ms)`
            )
        }
    }

    getState(): CircuitState {
        return this.state
    }

    getStats(){
        return {
            provider: this.providerName,
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
        }
    }
}