import { Client, LimitedCollection, type ParseMiddlewares, type ParseClient } from 'seyfert';
import config from "../../config";
import { YunaParser } from "yunaforseyfert";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";
import ShoukakuClient from "./music/Shoukaku";
import { Queue } from "./music/Queue";
import { AllMiddlewares } from '../../middlewares';


export class BaseClient extends Client<true> {
    public readonly cooldowns: LimitedCollection<string, number> = new LimitedCollection();
    public config: typeof config = config;
    public shoukaku: ShoukakuClient;
    public queue: Queue = new Queue(this);
    constructor() {
        super({
            globalMiddlewares: ["checkCooldown", "PlayerCheckMiddleware"],
            commands: {
                prefix: () => config.prefixes,
                reply: () => true,
                argsParser: YunaParser({
                    useUniqueNamedSyntaxAtSameTime: true,
                    enabled: {
                        namedOptions: ["-", "--"],
                    },
                }),
                deferReplyResponse: () => ({
                    content: `Please wait a moment, ${this.me.username} is processing your request...`,
                }),
            },
            allowedMentions: {
                replied_user: false,
                parse: ["roles"],
            },
            presence: () => ({
                afk: false,
                since: Date.now(),
                status: PresenceUpdateStatus.Idle,
                activities: [{ name: "This world is a fcuking mess", type: ActivityType.Playing }],
            }),
        });
        this.shoukaku = new ShoukakuClient(this, config.lavalink);
    }

    public async init(): Promise<void> {
        this.setServices({
            middlewares: AllMiddlewares,
        })
        await this.start();
        await this.uploadCommands();
    }
}

declare module "seyfert" {
    interface UsingClient extends ParseClient<BaseClient> { }
    interface Command extends Options { }
    interface SubCommand extends Options { }
    interface ComponentCommand extends Options { }
    interface ModalCommand extends Options { }
    interface ContextMenuCommand extends Options { }
    interface RegisteredMiddlewares extends ParseMiddlewares<typeof AllMiddlewares> { }
    interface GlobalMetadata extends ParseMiddlewares<typeof AllMiddlewares> { }
    interface InternalOptions {
        withPrefix: true;
    }
}

interface Options {
    cooldown?: number,
    sameVC?: boolean,
    inVC?: boolean,
    player?: boolean,
    queue?: boolean,
}