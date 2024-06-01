import { createEvent } from "seyfert";


export default createEvent({
    data: { name: "botReady", once: true },
    run: (user, client) => {
        client.logger.info(`Logged in as ${user.username} (${user.id})`);
    },
});