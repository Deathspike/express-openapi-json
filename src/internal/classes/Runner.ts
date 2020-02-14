import * as api from '..';
import * as express from 'express';

export class Runner {
  private readonly _ajv: api.Ajv;
  private readonly _operation: api.IOpenApiOperation;
  private readonly _operationHandler: api.IOperationHandler;
  
  constructor(ajv: api.Ajv, operation: api.IOpenApiOperation, operationHandler: api.IOperationHandler) {
    this._ajv = ajv;
    this._operation = operation;
    this._operationHandler = operationHandler;
  }

  async requestHandlerAsync(req: express.Request, res: express.Response) {
    try {
      const context = this._create(req);
      if ((this._operation.parameters || this._operation.requestBody) && !this._ajv.validateRequest(this._operation, context)) {
        res.status(400);
        res.json({message: 'Request validation failed', validationError: this._ajv.errorText});
      } else {
        const result = await this._operationHandler(context);
        const {responseKey, response} = this._find(String(result.statusCode));
        if (typeof result.content === 'function') {
          result.content(req, res);
        } else if (!response.content) {
          if (result.content) throw new Error('Invalid result content (Should be empty)');
          res.status(result.statusCode);
          res.end();
        } else if (!result.content) {
          throw new Error('Invalid result content (Should be populated)');
        } else if (!this._ajv.validateResponse(this._operation, responseKey, result.content)) {
          res.status(500);
          res.json({message: 'Response validation failed', validationError: this._ajv.errorText});
        } else {
          res.status(result.statusCode);
          res.json(result.content);
        }
      }
    } catch (error) {
      res.status(500);
      res.json({message: error && error.stack});
    }
  }

  private _create(req: express.Request): api.Context {
    const context = new api.Context(req);
    this._process(context);
    return context;
  }

  private _find(responseKey: string) {
    if (this._operation.responses[responseKey]) {
      const response = this._ajv.resolve(this._operation.responses[responseKey]);
      return {responseKey, response};
    } else if (this._operation.responses['default']) {
      const response = this._ajv.resolve(this._operation.responses['default']);
      return {responseKey, response};
    } else {
      throw new Error(`Unspecified status code: ${responseKey}`);
    }
  }

  private _process(context: api.Context) {
    if (this._operation.parameters) {
      for (const unresolvedParameter of this._ajv.resolve(this._operation.parameters)) {
        const parameter = this._ajv.resolve(unresolvedParameter);
        const parameterSchema = this._ajv.resolve(parameter.schema);
        if (parameterSchema && parameterSchema.type && api.isPrimitive(parameterSchema.type)) {
          const container = api.unsafe(context)[parameter.in];
          const value = container && container[parameter.name];
          if (typeof value === 'string') {
            switch (parameterSchema.type) {
              case 'boolean':
                if (!/^(1|0|true|false|yes|no)$/i.test(value)) break;
                container[parameter.name] = /^(1|true|yes)$/i.test(value);
                break;
              case 'integer':
                if (!/^[0-9]+$/.test(value)) break;
                container[parameter.name] = parseInt(value, 10);
                break;
              case 'number':
                if (!/^[0-9]+(\.[0-9]+)?$/.test(value)) break;
                container[parameter.name] = parseFloat(value);
                break;
            }
          }
        }
      }
    }
  }
}
