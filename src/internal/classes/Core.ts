import * as api from '..';
import * as express from 'express';

export class Core {
  private readonly _ajv: api.Ajv;
  private readonly _operations: api.Operations;
  private readonly _router: express.Router;

  constructor(openapi: api.IOpenApi, validationContext?: api.IValidationContext) {
    this._ajv = new api.Ajv(validationContext || api.createValidationContext(openapi));
    this._operations = new api.Operations(openapi);
    this._router = express.Router({caseSensitive: true, strict: true});
    this._router.get('/openapi.json', (_, res) => res.json(openapi));
  }

  controller(...controllers: any[]) {
    for (const controller of controllers) {
      for (const value of api.Metadata.for(controller).getAll()) {
        this.operation(value.operationId, controller[value.actionName].bind(controller), ...value.requestHandlers)
      }
    }
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
