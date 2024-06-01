import { Connectors, type NodeOption, Shoukaku } from 'shoukaku';
import type { BaseClient } from '../BaseClient';

export default class ShoukakuClient extends Shoukaku {
    public client: BaseClient;

    constructor(client: BaseClient, nodes: NodeOption[]) {
        super(new Connectors.Seyfert(client), nodes, {
            moveOnDisconnect: false,
            resume: false,
            reconnectInterval: 30,
            reconnectTries: 2,
            restTimeout: 10000,
            userAgent: "Fuck bot", // don't change this
            nodeResolver: nodes =>
                [...nodes.values()]
                    .filter(node => node.state === 2)
                    .sort((a, b) => a.penalties - b.penalties)
                    .shift(),
        });
        this.client = client;

        this.on('ready', (name, reconnected) => {
            if (reconnected) {
                this.client.logger.warn(`Node reconnected ${name}`);
            }
            this.client.logger.info(`Node ${name} is connect`)
        });

        this.on('error', (name, error) => {
            this.client.logger.error(`Got A error in ${name}\n${error}`)
        });

        this.on("close", (name, code, reason) => {
            this.client.logger.debug(`Node ${name} closed with code ${code} and reason ${reason}`);
        })

        this.on('disconnect', (name, count) => {
            this.client.logger.warn(`Node ${name} disconnected ${count} times`);
        });
        
    }
}
