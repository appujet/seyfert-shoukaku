

export function formatTime(ms: number): string {
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    if (ms < minuteMs) {
        return `${ms / 1000}s`;
    }
    if (ms < hourMs) {
        return `${Math.floor(ms / minuteMs)}m ${Math.floor((ms % minuteMs) / 1000)}s`;
    }
    if (ms < dayMs) {
        return `${Math.floor(ms / hourMs)}h ${Math.floor((ms % hourMs) / minuteMs)}m`;
    }
        
    return `${Math.floor(ms / dayMs)}d ${Math.floor((ms % dayMs) / hourMs)}h`;
}