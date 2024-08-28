import Fastify from 'fastify';
import logger from './libs/pino';

const createApp = async () => {
  const app = Fastify({
    logger: logger,
    disableRequestLogging: true
  });
  
  app.addHook('preHandler', (request, reply, done) => {
    const requestInfo = {
      reqId: request.id,
      method: request.method,
      url: request.routeOptions.url,
      path: request.routerPath,
      parameters: request.params,
      headers: request.headers,
      body: request.body ? request.body : undefined
    }
  
    logger.info(requestInfo, 'request received')
  
    done()
  });
  
  app.addHook('onSend', (request, reply, payload) => {
    let body = null
  
    try {
      body = JSON.parse(payload as string)
    } catch (err) {
      logger.error(err)
    }
  
    const responseInfo = {
      reqId: request.id,
      headers: typeof reply.getHeaders === 'function'
        ? reply.getHeaders()
        : {},
      body
    }
  
    logger.info(responseInfo, 'response sent')
  });

  return app;
}


export default createApp;