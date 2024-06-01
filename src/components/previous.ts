import { ComponentCommand, type ComponentContext } from "seyfert";
import { CommandOptions } from "../lib/utils/Decorators";

@CommandOptions({ inVC: true, sameVC: true, player: true, queue: true })
export default class PreviousComponent extends ComponentCommand {
    componentType = "Button" as const;
    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "previous";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const dispatcher = client.queue.get(ctx.guildId);
        if (!dispatcher) return;
        if (!dispatcher.previous) {
            return await ctx.write({
                content: "No songs in queue",
            });
        }

        dispatcher.previousTrack();
        await ctx.interaction.deferUpdate();
    }
}