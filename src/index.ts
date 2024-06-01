import { BaseClient } from './lib/structures/BaseClient';

const client = new BaseClient();

(async () => {
    await client.init();
})();

process.on("unhandledRejection", (reason, promise) => {
    client.logger.fatal("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
    client.logger.fatal("Uncaught Exception thrown:", err);
});

const handleExit = async () => {
    if (client) {
        client.logger.info("Shutting down...");
        await client.gateway.disconnectAll();
        client.logger.info("Disconnected from gateway");
        process.exit();
    }
};
process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
process.on("SIGQUIT", handleExit);

