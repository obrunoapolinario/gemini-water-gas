import pino from "pino";
import env from "../config/env";

const redact = process.env.LOG_REDACT?.split(",");

const logger = pino({
	level: env.LOG_LEVEL,
	redact,
});

export default logger;
