import { ComponentCommand, type ComponentContext } from "seyfert";
import { CommandOptions } from "../lib/utils/Decorators";

@CommandOptions({ inVC: true, sameVC: true, player: true, queue: true })
export default class LoopComponent extends ComponentCommand {
    componentType = "Button" as const;
    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "loop";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const dispatcher = client.queue.get(ctx.guildId);
        if (!dispatcher) return;
        if (!dispatcher.current) {
            return await ctx.write({
                content: "No songs in queue",
            });
        }

        switch (dispatcher.loop) {
            case "off":
                dispatcher.loop = "repeat";
                await ctx.write({
                    content: "Looping the current song",
                }, true).then((m) => {
                    setTimeout(() => {
                        m.delete();
                    }, 5000);
                });
                break;
            case "repeat":
                dispatcher.loop = "queue";
                await ctx.write({
                    content: "Looping the queue",
                }, true).then((m) => {
                    setTimeout(() => {
                        m.delete();
                    }, 5000);
                });
                break;
            case "queue":
                dispatcher.loop = "off";
                await ctx.write({
                    content: "Looping disabled",
                }, true).then((m) => {
                    setTimeout(() => {
                        m.delete();
                    }, 5000);
                });
                break;
        }
    }
}