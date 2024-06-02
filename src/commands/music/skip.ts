import { Declare, Command, type CommandContext, } from 'seyfert';
import { CommandOptions } from '../../lib/utils/Decorators';


@Declare({
    name: 'skip',
    description: 'Skip the current song',
    aliases: ['s'],
})

@CommandOptions({ inVC: true, sameVC: true, player: true, queue: true })
export default class SkipCommand extends Command {
    async run(ctx: CommandContext): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const dispatcher = client.queue.get(ctx.guildId);
        if (!dispatcher) return;
        if (!dispatcher.queue.length) {
            await ctx.write({
                content: "No songs in queue",
            });
            return;
        }

        dispatcher.skip();
        await ctx.write({
            content: "Skipped the current song",
        });
    }
}