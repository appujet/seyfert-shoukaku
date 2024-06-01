import type { Message, User } from 'seyfert';
import type { Node, Player, Track } from 'shoukaku';
import type { BaseClient } from '../BaseClient';
import playerHandler from './handlers/Player';



export class Song implements Track {
    encoded: string;
    info: {
        identifier: string;
        isSeekable: boolean;
        author: string;
        length: number;
        isStream: boolean;
        position: number;
        title: string;
        uri?: string;
        artworkUrl?: string;
        isrc?: string;
        sourceName: string;
        requester: User;
    };
    pluginInfo: unknown;

    constructor(track: Song | Track, user: User) {
        if (!track) throw new Error('Track is not provided');
        this.encoded = track.encoded;
        this.info = {
            ...track.info,
            requester: user,
        };
    }
}

interface DispatcherOptions {
    client: BaseClient;
    guildId: string;
    channelId: string;
    player: Player;
    node: Node;
}

export default class Dispatcher {
    public client: BaseClient;
    public guildId: string;
    public channelId: string;
    public player: Player;
    public queue: Song[];
    public stopped: boolean;
    public previous: Song | null;
    public current: Song | undefined;
    public loop: 'off' | 'repeat' | 'queue';
    public requester: User | undefined;
    public repeat: number;
    public node: Node;
    public paused: boolean;
    public filters: string[];
    public autoplay: boolean;
    public nowPlayingMessage: Message | null;
    public history: Song[];
    private playerHandler: playerHandler;
    constructor(options: DispatcherOptions) {
        this.client = options.client;
        this.guildId = options.guildId;
        this.channelId = options.channelId;
        this.player = options.player;
        this.queue = [];
        this.stopped = false;
        this.previous = null;
        this.current = undefined;
        this.loop = 'off';
        this.repeat = 0;
        this.node = options.node;
        this.paused = false;
        this.filters = [];
        this.autoplay = false;
        this.nowPlayingMessage = null;
        this.history = [];
        this.playerHandler = new playerHandler();
        this.player
            .on('start', () => {
                if (this.current) {
                    this.playerHandler.trackStart(this.current, this);
                }
            })
            .on('end', () => {
                if (!this.queue.length) {
                    this.playerHandler.queueEnd(this.current || this.queue[0], this);
                }
                this.playerHandler.trackEnd(this.current || this.queue[0], this);
            })
            .on('stuck', () => this.client.shoukaku.emit('trackStuck', this.player, this.current))
            .on('closed', (...args) =>
                this.client.shoukaku.emit('socketClosed', this.player, ...args)
            );
    }

    get exists(): boolean {
        return this.client.queue.has(this.guildId);
    }

    get volume(): number {
        return this.player.volume;
    }

    public play(): void {
        if (!this.exists || (!(this.queue.length || this.current))) {
            return;
        }
        this.current = this.queue.length ? this.queue.shift() : this.queue[0];
        if (this.current) {
            this.player.playTrack({ track: { encoded: this.current.encoded } });
            this.history.push(this.current);
            if (this.history.length > 100) {
                this.history.shift();
            }
        }
    }

    public pause(): void {
        if (this.player) {
            this.paused = !this.paused;
            this.player.setPaused(this.paused);
        }
    }

    public remove(index: number): void {
        if (this.player && index <= this.queue.length) {
            this.queue.splice(index, 1);
        }
    }

    public previousTrack(): void {
        if (this.player && this.previous) {
            this.queue.unshift(this.previous);
            this.player.stopTrack();
        }
    }

    public destroy(): void {
        this.queue.length = 0;
        this.history = [];
        this.client.shoukaku.leaveVoiceChannel(this.guildId);
        this.client.queue.delete(this.guildId);
        if (!this.stopped) {
            this.client.shoukaku.emit('playerDestroy', this.player);
        }
    }

    public setShuffle(): void {
        if (this.player) {
            for (let i = this.queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
            }
        }
    }

    public skip(skipto = 1): void {
        if (this.player) {
            if (skipto > this.queue.length) {
                this.queue.length = 0;
            } else {
                this.queue.splice(0, skipto - 1);
            }
            this.repeat = this.repeat === 1 ? 0 : this.repeat;
            this.player.stopTrack();
        }
    }

    public seek(time: number): void {
        if (this.player) {
            this.player.seekTo(time);
        }
    }

    public stop(): void {
        if (this.player) {
            this.queue.length = 0;
            this.history = [];
            this.loop = 'off';
            this.autoplay = false;
            this.repeat = 0;
            this.stopped = true;
            this.player.stopTrack();
        }
    }

    public setLoop(loop: 'off' | 'repeat' | 'queue'): void {
        this.loop = loop;
    }

    public buildTrack(track: Song | Track, user: User): Song {
        return new Song(track, user);
    }

    public async isPlaying(): Promise<void> {
        if (this.queue.length && !this.current && !this.player.paused) {
            await this.play();
        }
    }

    public async Autoplay(song: Song): Promise<void> {
        const resolve = await this.node.rest.resolve(
            `ytsearch:${song.info.author}`
        );
        // biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
        if (!resolve || !resolve.data || !Array.isArray(resolve.data)) {
            return this.destroy();
        }

        const metadata = resolve.data as Track[];
        let chosen: Song | null = null;
        const maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const potentialChoice = this.buildTrack(
                metadata[Math.floor(Math.random() * metadata.length)],
                this.client.me
            );
            if (
                !(this.queue.some(s => s.encoded === potentialChoice.encoded) || this.history.some(s => s.encoded === potentialChoice.encoded))
            ) {
                chosen = potentialChoice;
                break;
            }
            attempts++;
        }

        if (chosen) {
            this.queue.push(chosen);
            await this.isPlaying();
        } else {
            this.destroy();
        }
    }

    public async setAutoplay(autoplay: boolean): Promise<void> {
        this.autoplay = autoplay;
        if (autoplay) {
            await this.Autoplay(this.current || this.queue[0]);
        }
    }
}
