import { Throttle } from "@nestjs/throttler";

export const StrictThrottler = () => Throttle({
    default: { ttl: 1000, limit: 3 }
});

export const ModerateThrottle = () => Throttle({
    default: { ttl: 1000, limit: 5 }
})

export const RelaxedThrottle = () => Throttle({
    default: { ttl: 1000, limit: 20 }
})