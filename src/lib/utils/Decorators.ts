
export function CommandOptions(options: Options) {
    return <T extends { new(...args: any[]): {} }>(target: T) =>
        class extends target {
            cooldown = options.cooldown;
            sameVC = options.sameVC;
            inVC = options.inVC;
            player = options.player;
            queue = options.queue;
        };
}
interface Options {
    cooldown?: number,
    sameVC?: boolean,
    inVC?: boolean,
    player?: boolean,
    queue?: boolean,
}