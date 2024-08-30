import createApp from "./app";
import env from "./config/env";
import logger from "./libs/pino";

const start = async () => {
	try {
		const app = await createApp();
		await app.listen({ port: env.PORT, host: "0.0.0.0" });
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

start();
