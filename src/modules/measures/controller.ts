import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { confirmSchema, measureResponseSchema, measureTypeEnumSchema, uploadSchema } from "./schemas";
import { z } from "zod";
import { Base64 } from "js-base64";
import logger from "../../libs/pino";
import { confirmMeasure, createMeasure } from "./service";
import { listByCustomerCode } from "./repository";
import { InvalidDataError, InvalidTypeError, MeasureNotFoundError, MeasuresNotFoundError } from "../../errors/errors";

export const measureController = async (fastify: FastifyInstance) => {
	fastify.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
		const data = uploadSchema.parse(request.body);

		if (!Base64.isValid(data.image)) {
			throw new InvalidDataError("Invalid image");
		}

		const result = await createMeasure(data);

		return reply.code(200).send(result);
	});

	fastify.patch("/confirm", async (request: FastifyRequest, reply: FastifyReply) => {
		const { measure_uuid, confirmed_value } = confirmSchema.parse(request.body);

		const result = await confirmMeasure(measure_uuid, confirmed_value);

		logger.info("Confirmed measure:", result);

		return reply.code(200).send({ measure_uuid, confirmed_value });
	});

	fastify.get(
		"/:customerCode/list",
		async (
			request: FastifyRequest<{ Params: { customerCode: string }; Querystring: { measureType?: string } }>,
			reply: FastifyReply,
		) => {
			const { customerCode } = request.params;
			const { measureType } = request.query;

			const listSchema = z.object({
				customer_code: z.string(),
				measure_type: measureTypeEnumSchema.optional(),
			});

			const { customer_code, measure_type } = listSchema.parse({
				customer_code: customerCode,
				measure_type: measureType,
			});

			if (measure_type && !["WATER", "GAS"].includes(measure_type.toUpperCase())) {
				throw new InvalidTypeError("Tipo de medição não permitida");
			}

			const measures = await listByCustomerCode(customer_code, measure_type);

			if (measures.length === 0) {
				throw new MeasuresNotFoundError("Nenhuma leitura encontrada");
			}

			return reply.code(200).send({
				customer_code,
				measures: measures.map((measure) => measureResponseSchema.parse(measure)),
			});
		},
	);
};
