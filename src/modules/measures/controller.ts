import type { FastifyRequest, FastifyReply } from 'fastify'
import { uploadSchema } from './schemas'
import type { MeasureService } from './service'
import { ZodError } from 'zod'
import { Base64 } from 'js-base64'
import logger from '../../libs/pino'

export class MeasureController {
  constructor(private measureService: MeasureService) {}

  async upload(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = uploadSchema.parse(request.body);
  
      if (!Base64.isValid(data.image)) {
        return reply.code(400).send({
          error_code: "INVALID_DATA",
          error_description: "Invalid base64 image"
        });
      }
  
      const result = await this.measureService.createMeasure(data);
      return reply.code(200).send(result);
    } catch (error) {
      logger.error(error);
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error_code: "INVALID_DATA",
          error_description: error.message
        });
      }
      return reply.code(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "An unexpected error occurred"
      });
    }
  }
/*
  async confirm(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { measure_uuid, confirmed_value } = confirmSchema.parse(request.body)
  
      const result = await this.measureService.confirmMeasure(measure_uuid, confirmed_value)
  
      if (result.error === 'MEASURE_NOT_FOUND') {
        return reply.code(404).send({
          error_code: "MEASURE_NOT_FOUND",
          error_description: "Leitura não encontrada"
        })
      }
  
      if (result.error === 'CONFIRMATION_DUPLICATE') {
        return reply.code(409).send({
          error_code: "CONFIRMATION_DUPLICATE",
          error_description: "Leitura já confirmada"
        })
      }
  
      return reply.code(200).send({ success: true })
    } catch (error) {
      request.log.error(error)
      return reply.code(400).send({
        error_code: "INVALID_DATA",
        error_description: error.message
      })
    }
  }

  async list(request: FastifyRequest<{ Params: { customerCode: string }, Querystring: { measure_type?: string } }>, reply: FastifyReply) {
    const { customerCode } = request.params
    const { measure_type } = request.query
  
    if (measure_type && !['WATER', 'GAS'].includes(measure_type.toUpperCase())) {
      return reply.code(400).send({
        error_code: "INVALID_TYPE",
        error_description: "Tipo de medição não permitida"
      })
    }
  
    const measures = await this.measureService.listMeasures(customerCode, measure_type?.toUpperCase())
  
    if (measures.length === 0) {
      return reply.code(404).send({
        error_code: "MEASURES_NOT_FOUND",
        error_description: "Nenhuma leitura encontrada"
      })
    }
  
    return reply.code(200).send({
      customer_code: customerCode,
      measures: measures.map(m => ({
        measure_uuid: m.id,
        measure_datetime: m.measureDatetime,
        measure_type: m.measureType,
        has_confirmed: m.hasConfirmed,
        image_url: m.imageUrl
      }))
    })
  }*/
}