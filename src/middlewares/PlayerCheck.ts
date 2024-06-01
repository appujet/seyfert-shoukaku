import { createMiddleware } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";


export const PlayerCheckMiddleware = createMiddleware<void>(({ context, next }) => {
    const { client, member, command, guildId } = context;
    if (!guildId) return;
    
    const voice = member?.voice();
    const botVoice = context.me()?.voice();

    const dispatcher = client.queue.get(guildId);

    if (command?.inVC && !voice) {
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            content: "You need to be in a voice channel to use this command",
        });
    }

    if (command?.sameVC && botVoice && botVoice.channelId !== voice?.channelId) {
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            content: "You need to be in the same voice channel as me to use this command",
        });
    }

    if (command?.player && !dispatcher) {
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            content: "I am not playing anything in this server",
        });
    }

    if (command?.queue && dispatcher?.queue.length === 0) {
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            content: "There is nothing in the queue",
        });
    }

    return next();
});

