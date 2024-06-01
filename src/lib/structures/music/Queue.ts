import type { LavalinkResponse } from 'shoukaku';
import type { CommandContext } from 'seyfert';
import type { BaseClient } from '../BaseClient';
import Dispatcher from './Dispatcher';


export class Queue extends Map<string, Dispatcher> {
    public client: BaseClient;

    constructor(client: BaseClient) {
        super();
        this.client = client;
    }

    public override get(guildId: string): Dispatcher | undefined {
        return super.get(guildId);
    }

    public override set(guildId: string, dispatcher: Dispatcher): this {
        return super.set(guildId, dispatcher);
    }

    public override delete(guildId: string): boolean {
        return super.delete(guildId);
    }

    public override clear(): void {
        super.clear();
    }

    public async create(
        ctx: CommandContext,
    ): Promise<Dispatcher> {
    
        const voiceChannel = ctx.member?.voice()?.channelId;
        const textChannel = ctx.channel("cache")
        const guildId = ctx.guildId;
        if (!voiceChannel) throw new Error('No voice channel was provided');
        if (!textChannel) throw new Error('No text channel was provided');
        if (!guildId) throw new Error('No guild was provided');

        let dispatcher = this.get(guildId);
        if (!dispatcher) {
            const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
            if (!node) throw new Error('No available nodes');
            const player = await this.client.shoukaku.joinVoiceChannel({
                guildId: guildId,
                channelId: voiceChannel,
                shardId: ctx.shardId,
                deaf: true,
            });

            dispatcher = new Dispatcher({
                client: this.client,
                guildId: guildId,
                channelId: textChannel.id,
                player,
                node,
            });

            this.set(guildId, dispatcher);
            this.client.shoukaku.emit('playerCreate', dispatcher.player);
        }

        return dispatcher;
    }

    public async search(query: string): Promise<LavalinkResponse | undefined> {
        const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes)
        const searchQuery = /^https?:\/\//.test(query)
            ? query
            : `ytsearch:${query}`;
        try {
            if (node) {
                return await node.rest.resolve(searchQuery);
            }
        } catch (err) {
            console.error('Error during search:', err);
            return undefined;
        }
        return undefined;
    }
}