import { Declare, Command, type CommandContext, createStringOption, Options } from 'seyfert';
import { LoadType } from 'shoukaku';
import { CommandOptions } from '../../lib/utils/Decorators';


const options = {
    query: createStringOption({
        description: "Enter the song name/url.",
        required: true,
        autocomplete: async (interaction) => {
            const { client } = interaction;

            const query = interaction.getInput()

            if (!query) {
                return interaction.respond([
                    {
                        name: 'No matches found',
                        value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
                    }
                ])
            }

            const res = await client.queue.search(query);
            if (!res) return interaction.respond([
                {
                    name: 'No matches found',
                    value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
                }
            ]);

            if (res.loadType === LoadType.EMPTY || res.loadType === LoadType.ERROR) {
                return interaction.respond([
                    {
                        name: 'No matches found',
                        value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
                    }
                ]);
            }
            if (res.loadType === LoadType.SEARCH) {
                const tracks = res.data.slice(0, 25).map((track, index) => {
                    return {
                        name: `${index + 1}. ${track.info.title.slice(0, 30)} - ${track.info.author.slice(0, 30)}`,
                        value: track.info.uri || "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
                    }
                })
                return interaction.respond(tracks)
            }
        }
    }),
};

@Declare({
    name: 'play',
    description: 'Play a song',
    aliases: ['p'],
})
@Options(options)
@CommandOptions({
    cooldown: 5,
    inVC: true,
    sameVC: true,
})
export default class PlayCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const query = ctx.options.query;
        if (!query) {
            return await ctx.write({
                content: 'Please provide a song name or url'
            });
        }
        let dispatcher = ctx.client.queue.get(ctx.guildId!);
        if (!dispatcher) {
            dispatcher = await ctx.client.queue.create(ctx);
        }
        const res = await ctx.client.queue.search(query);
        if (!res) return await ctx.write({
            content: 'No matches found'
        });
        if (res.loadType === LoadType.EMPTY || res.loadType === LoadType.ERROR) {
            return await ctx.write({
                content: 'No matches found'
            });
        }
        if (res.loadType === LoadType.TRACK) {
            const track = dispatcher.buildTrack(res.data, ctx.author);
            dispatcher.queue.push(track);
            await dispatcher.isPlaying();
            return await ctx.write({
                content: `Queued: \`${track.info.title}\``
            });
        }
        if (res.loadType === LoadType.SEARCH) {
            const track = dispatcher.buildTrack(res.data[0], ctx.author);
            dispatcher.queue.push(track);
            await dispatcher.isPlaying();
            return await ctx.write({
                content: `Queued: \`${track.info.title}\``
            });
        }
        if (res.loadType === LoadType.PLAYLIST) {
            for (const track of res.data.tracks) {
                const song = dispatcher.buildTrack(track, ctx.author);
                dispatcher.queue.push(song);
            }
            await dispatcher.isPlaying();
            return await ctx.write({
                content: `Queued: \`${res.data.tracks.length}\` songs from \`${res.data.info.name}\``
            });
        }
    }
}