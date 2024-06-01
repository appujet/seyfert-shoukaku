import { type CommandContext, type ComponentContext, createMiddleware, type MenuCommandContext, type MessageCommandInteraction, type ModalContext, type UserCommandInteraction } from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { MessageFlags } from "seyfert/lib/types";

type CommandData = {
    name: string;
    type: string;
};
export type AnyContext =
    | CommandContext
    | MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>
    | ComponentContext
    | ModalContext;

    
function getMetadata(ctx: AnyContext): CommandData {
    if (ctx.isChat() || ctx.isMenu())
        return {
            name: ctx.fullCommandName,
            type: "command",
        };

    if (ctx.isComponent() || ctx.isModal())
        return {
            name: ctx.customId,
            type: "component",
        };

    return {
        name: "---",
        type: "any",
    };
}

export const checkCooldown = createMiddleware<void>(({ context, next }) => {
    const { client, author, command } = context;
    const { cooldowns } = client;

    if (!command) return;

    const { name, type } = getMetadata(context);

    const cooldown = (command.cooldown ?? 5) * 1000;
    const timeNow = Date.now();
    const setKey = `${name}-${type}-${author.id}`;

    const data = cooldowns.get(setKey);
    if (data && timeNow < data)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    title: "Cooldown",
                    description: `You are in cooldown. Please wait for <t:${Math.floor(data / 1000)}:R>`,
                    color: EmbedColors.Red,
                },
            ],
        });

    cooldowns.set(setKey, timeNow + cooldown, cooldown);

    return next();
});