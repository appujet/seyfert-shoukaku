
import type Dispatcher from "../Dispatcher";
import type { Song } from "../Dispatcher";
import { ActionRow, Button, Embed } from "seyfert";
import { formatTime } from "../../../utils/Utils";
import { ButtonStyle } from "seyfert/lib/types";


export default class playerHandler {

    public async trackStart(track: Song, dispatcher: Dispatcher) {
        // biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
        if (!track || !track.info) return;
        
        const guild = await dispatcher.client.guilds.fetch(dispatcher.guildId);
        if (!guild) return;
    
        const textChannel = await guild.channels.fetch(dispatcher.channelId);
        if (!textChannel) return;
        if (!textChannel.isTextGuild()) return;
        
        const embed = new Embed()
            .setTitle('Now Playing')
            .setDescription(`[${track.info.title}](${track.info.uri})`)
            .setFields([
                {
                    name: 'Author',
                    value: `\`${track.info.author}\``,	
                    inline: true
                },
                {
                    name: 'Requested by',
                    value: `<@${track.info.requester.id}>`,
                    inline: true
                }
            ])
            .setThumbnail(track.info.artworkUrl)
            .setColor("Random")
            .setFooter({ text: `Duration:  ${formatTime(track.info.length)}` });

        const row = new ActionRow<Button>().addComponents(
            new Button().setLabel("Previous").setStyle(ButtonStyle.Secondary).setCustomId("previous"),
            new Button().setLabel("Pause").setStyle(ButtonStyle.Secondary).setCustomId("pause"),
            new Button().setLabel("Skip").setStyle(ButtonStyle.Secondary).setCustomId("skip"),
            new Button().setLabel("Stop").setStyle(ButtonStyle.Secondary).setCustomId("stop"),
            new Button().setLabel("Loop").setStyle(ButtonStyle.Secondary).setCustomId("loop"),
        );
    

        const message = await textChannel.messages.write({ embeds: [embed], components: [row]});
        dispatcher.nowPlayingMessage = message;
    }

    public async trackEnd(track: Song, dispatcher: Dispatcher) {
        dispatcher.previous = dispatcher.current || null;
        dispatcher.current = undefined;

        const nowPlayingMessage = await dispatcher.nowPlayingMessage?.fetch().catch(() => null);

        switch (dispatcher.loop) {
            case 'repeat':
                dispatcher.queue.unshift(track);
                break;
            case 'queue':
                dispatcher.queue.push(track);
                break;
        }

        dispatcher.play();

        if (dispatcher.autoplay) {
            await dispatcher.Autoplay(track);
        }

        if (nowPlayingMessage) {
            await nowPlayingMessage.delete().catch(() => { });
        }
    }

    public async queueEnd(track: Song, dispatcher: Dispatcher) {

        switch (dispatcher.loop) {
            case 'repeat':
                dispatcher.queue.unshift(track);
                break;
            case 'queue':
                dispatcher.queue.push(track);
                break;
            case 'off':
                dispatcher.previous = dispatcher.current || null;
                dispatcher.current = undefined;
                break;
        }

        if (dispatcher.autoplay) {
            await dispatcher.Autoplay(track);
        } else {
            dispatcher.autoplay = false;
        }
    }
}