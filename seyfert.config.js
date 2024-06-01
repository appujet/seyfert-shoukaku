const { config } = require('seyfert');
require("dotenv/config");

module.exports = config.bot({
    token: process.env.TOKEN ?? "",
    intents: [
        "Guilds",
        "MessageContent",
        "GuildMessages",
        "GuildVoiceStates",
        "GuildMembers",
    ],
    /**
     * @type {import("seyfert").RuntimeConfig["locations"] & { lavalink: string }}
     */
    locations: {
        base: "src",
        output: "dist",
        commands: "commands",
        events: "events",
        components: "components",
    }
});