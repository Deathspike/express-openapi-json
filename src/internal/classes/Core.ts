import * as api from '..';
import * as express from 'express';

export class Core {
  private readonly _ajv: api.Ajv;
  private readonly _operations: api.Operations;
  private readonly _router: express.Router;

  constructor(openapi: api.IOpenApi, validationContext: api.IValidationContext | undefined) {
    this._ajv = new api.Ajv(validationContext || api.createValidationContext(openapi));
    this._operations = new api.Operations(openapi);
    this._router = express.Router({caseSensitive: true, strict: true});
    this._router.get('/openapi.json', (_, res) => res.json(openapi));
  }

  controller(...controllers: any[]) {
    const values = controllers.map((controller) => api.Metadata.for(controller).getAll()).reduce((x, y) => x.concat(y));
    values.forEach((value) => this.operation(value.operationId, value.operationHandler, ...value.requestHandlers));
    return this;
  }
  
  operation(operationId: string, operationHandler: api.IOperationHandler, ...requestHandlers: express.RequestHandler[]) {
    const {path, method, operation} = this._operations.get(operationId);
    const runner = new api.Runner(this._ajv, operation, operationHandler);
    this._add(method, path, requestHandlers.concat(runner.requestHandlerAsync.bind(runner)));
    return this;
  }

  router() {
    this._router.use((_, res) => res.status(404).end());
    return this._router;
  }

  private _add(method: string, path: string, requestHandlers: express.RequestHandler[]) {
    if (!api.isValidMethod(method)) throw new Error(`Invalid method: ${method}`);
    if (!api.isValidPath(path)) throw new Error(`Invalid path: ${path}`);
    api.unsafe(this._router)[method](path.replace(/{(.+?)}/g, ':$1'), requestHandlers);
  }
}
