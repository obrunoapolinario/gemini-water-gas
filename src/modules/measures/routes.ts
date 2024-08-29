import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MeasureController } from './controller'
import { MeasureService } from './service'
import { PrismaClient } from '@prisma/client'

interface ListRequestParams {
  customerCode: string;
}

interface ListRequestQuerystring {
  measure_type?: string;
}

export async function measureRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient()
  const measureService = new MeasureService(prisma)
  const measureController = new MeasureController(measureService)

  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    return measureController.upload(request, reply)
  })
/*
  fastify.patch('/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    return measureController.confirm(request, reply)
  })

  fastify.get<{
    Params: ListRequestParams;
    Querystring: ListRequestQuerystring;
  }>('/:customerCode/list', async (request, reply) => {
    return measureController.list(request, reply)
  })*/
}