import Fastify from "fastify";
import logger from "./libs/pino";
import { measureController } from "./modules/measures/controller";
import env from "./config/env";
import { ZodError } from "zod";
import { AppError } from "./errors/errors";

const createApp = async () => {
	const app = Fastify({
		logger: logger,
		disableRequestLogging: true,
	});

	app.addHook("preHandler", (request, reply, done) => {
		const requestInfo = {
			reqId: request.id,
			method: request.method,
			url: request.routeOptions.url,
			parameters: request.params,
			headers: request.headers,
			body: request.body ? request.body : undefined,
		};

		logger.info(requestInfo, "request received");

		done();
	});

	app.addHook("onSend", (request, reply, payload, done) => {
		let body = null;

		try {
			body = JSON.parse(payload as string);
		} catch (err) {
			logger.error(err);
		}

		const responseInfo = {
			reqId: request.id,
			headers: typeof reply.getHeaders === "function" ? reply.getHeaders() : {},
			body,
		};

		logger.info(responseInfo, "response sent");
		done();
	});

	await app.register(measureController);

	app.setErrorHandler((error, _, reply) => {
		if (error instanceof AppError) {
			return reply
				.status(error.statusCode)
				.send({ error_code: error.errorCode, error_description: error.message });
		}

		if (error instanceof ZodError) {
			return reply.status(400).send({ message: "INVALID_DATA", issue: error.format() });
		}

		if (env.NODE_ENV !== "production") {
			logger.error(`Error caught: ${error}`);
		} else {
			logger.error(`[PROD] Error caught: ${error}`);
		}

		return reply.status(500).send({ message: "Internal server error." });
	});

	return app;
};

export default createApp;
