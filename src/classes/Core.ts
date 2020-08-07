import * as app from '..';
import * as apx from '../internal';

export class Core {
  private readonly _ajv: apx.Ajv;
  private readonly _operations: apx.Operations;
  private readonly _router: app.Router;

  constructor(openapi: app.IOpenApi) {
    this._ajv = new apx.Ajv(app.createValidationContext(openapi));
    this._operations = new apx.Operations(openapi);
    this._router = new app.Router();
    this._router.add('GET', '/openapi.json', () => app.content(openapi));
  }

  controller(...controllers: any[]) {
    for (const controller of controllers) {
      for (const value of apx.Metadata.for(controller).getAll()) {
        this.operation(value.operationId, controller[value.actionName].bind(controller))
      }
    }
    return this;
  }
  
  operation(operationId: string, operationHandler: app.IOperationHandler) {
    const {path, method, operation} = this._operations.get(operationId);
    const runner = new apx.Runner(this._ajv, operation, operationHandler);
    this._router.add(method, path, runner.handleAsync.bind(runner));
    return this;
  }

  router() {
    return this._router;
  }
}
