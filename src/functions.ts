import * as api from './internal';
import * as express from 'express';

export function createCore(openapi: api.IOpenApi) {
  return new api.Core(openapi);
}

export function createOperation(operationId: string, ...requestHandlers: express.RequestHandler[]) {
  return (controller: any, actionName: string) => api.Metadata.for(controller).create(actionName, operationId, requestHandlers);
}

export function json<T>(content: T, statusCode = 200) {
  return new api.Result(statusCode, content);
}

export function status(statusCode = 200) {
  return new api.Result(statusCode);
}
