import { ComponentCommand, type ComponentContext } from "seyfert";
import { CommandOptions } from "../lib/utils/Decorators";


@CommandOptions({ inVC: true, sameVC: true, player: true, queue: true })
export default class PauseComponent extends ComponentCommand {
    componentType = "Button" as const;
    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "pause";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const dispatcher = client.queue.get(ctx.guildId);
        if (!dispatcher) return;
        if (!dispatcher.current) {
            return await ctx.write({
                flags: 64,
                content: "No songs in queue",
            });
        }
        dispatcher.pause();
        await ctx.write({
            content: `${dispatcher.paused ? "Paused" : "Resumed"} the player by \`${ctx.author.username}\``,
        }, true).then((m) => {
            setTimeout(() => {
                m.delete();
            }, 5000);
        });
    }
}