import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { confirmSchema, measureTypeEnumSchema, uploadSchema } from './schemas'
import { z, ZodError } from 'zod'
import { Base64 } from 'js-base64'
import logger from '../../libs/pino'
import { confirmMeasure, createMeasure } from './service'
import { listByCustomerCode } from './repository'

export const measureController = async (fastify: FastifyInstance) => {
  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = uploadSchema.parse(request.body);
  
      if (!Base64.isValid(data.image)) {
        return reply.code(400).send({
          error_code: "INVALID_DATA",
          error_description: "Invalid base64 image"
        });
      }
  
      const result = await createMeasure(data);
      
      if ('error_code' in result) {
        if (result.error_code === 'DOUBLE_REPORT') {
          return reply.code(409).send(result);
        }
        return reply.code(400).send(result);
      }
      
      return reply.code(200).send(result);
    } catch (error) {
      logger.error('Error in upload:', error);
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error_code: "INVALID_DATA",
          error_description: error.issues.map(issue => issue.message).join(', ')
        });
      }
      return reply.code(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "An unexpected error occurred"
      });
    }
  });

  fastify.patch('/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { measure_uuid, confirmed_value } = confirmSchema.parse(request.body)
  
      const result = await confirmMeasure(measure_uuid, confirmed_value)
  
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
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error_code: "INVALID_DATA",
          error_description: error.issues.map(issue => issue.message).join(', ')
        });
      }
      return reply.code(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "An unexpected error occurred"
      });
    }
  });

  fastify.get('/:customerCode/list', async (request: FastifyRequest<{ Params: { customerCode: string }, Querystring: { measureType?: string } }>, reply: FastifyReply) => {
    const { customerCode } = request.params
    const { measureType } = request.query

    const listSchema = z.object({
      customer_code: z.string(),
      measure_type: measureTypeEnumSchema.optional()
    })

    const { customer_code, measure_type } = listSchema.parse({
      customer_code: customerCode,
      measure_type: measureType
    });
  
    if (measure_type && !['WATER', 'GAS'].includes(measure_type.toUpperCase())) {
      return reply.code(400).send({
        error_code: "INVALID_TYPE",
        error_description: "Tipo de medição não permitida"
      })
    }
  
    const measures = await listByCustomerCode(customer_code, measure_type)
  
    if (measures.length === 0) {
      return reply.code(404).send({
        error_code: "MEASURES_NOT_FOUND",
        error_description: "Nenhuma leitura encontrada"
      })
    }
  
    return reply.code(200).send({
      customer_code: customerCode,
      measures: measures.map(m => ({
        measure_uuid: m.measure_uuid,
        measure_datetime: m.measure_datetime,
        measure_type: m.measure_type,
        has_confirmed: m.has_confirmed,
        image_url: m.image_url
      }))
    })
  });
}