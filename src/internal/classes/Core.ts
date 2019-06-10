import * as api from '..';
import * as express from 'express';

export class Core {
  private readonly _ajv: api.Ajv;
  private readonly _openapi: api.IOpenApi;
  private readonly _openapiJson: string;
  private readonly _router: express.Router;

  constructor(openapi: api.IOpenApi) {
    this._ajv = new api.Ajv(openapi);
    this._openapi = openapi;
    this._openapiJson = JSON.stringify(openapi, null, 2);
    this._router = express.Router();
    api.createSchemas(this._ajv, this._openapi);
  }

  controller(...controllers: any[]) {
    const items = controllers.map((controller) => api.Metadata.for(controller).get()).reduce((x, y) => x.concat(y));
    items.forEach((item) => this.operation(item.operationId, item.operationHandler, ...item.requestHandlers));
    return this;
  }
  
  operation(operationId: string, operationHandler: api.OperationHandler, ...requestHandlers: express.RequestHandler[]) {
    const {path, method, operation} = this._find(operationId);
    const runner = new api.Runner(this._ajv, operation, operationHandler);
    this._add(operationId, method, path, requestHandlers.concat(runner.requestHandlerAsync.bind(runner)));
    return this;
  }

  router() {
    this._router.get(`/openapi.json`, (_, res) => res.contentType('json').send(this._openapiJson));
    this._router.use((_, res) => res.status(404).end());
    return this._router;
  }

  private _add(operationId: string, method: string, path: string, requestHandlers: express.RequestHandler[]) {
    if (!api.isValidMethod(method)) throw new Error(`Invalid method. OperationId=${operationId}, Method=${method}`);
    if (!api.isValidPath(path)) throw new Error(`Invalid path. OperationId=${operationId}, Path=${path}`);
    api.unsafe(this._router)[method](path.replace(/{(.+?)}/, ':$1'), requestHandlers);
  }

  private _find(operationId: string) {
    for (const path in this._openapi.paths) {
      for (const method in this._openapi.paths[path]) {
        const operation = this._ajv.resolve(this._openapi.paths[path][method]);
        if (operation.operationId !== operationId) continue;
        return {path, method, operation};
      }
    }
    throw new Error(`Unknown operation identifier. OperationId=${operationId}`);
  }
}
