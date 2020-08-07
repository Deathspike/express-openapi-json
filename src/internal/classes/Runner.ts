import * as app from '../..';
import * as apx from '..';

export class Runner {
  private readonly _ajv: apx.Ajv;
  private readonly _operation: app.IOpenApiOperation;
  private readonly _operationHandler: app.IOperationHandler;
  
  constructor(ajv: apx.Ajv, operation: app.IOpenApiOperation, operationHandler: app.IOperationHandler) {
    this._ajv = ajv;
    this._operation = operation;
    this._operationHandler = operationHandler;
  }

  async handleAsync(context: app.Context) {
    try {
      this._process(context);
      if ((this._operation.parameters || this._operation.requestBody) && !this._ajv.validateRequest(this._operation, context)) {
        return new app.Result(`Request validation failed: ${this._ajv.errorText}`, 400);
      } else {
        const result = await this._operationHandler(context);
        const response = this._find(String(result.statusCode));
        if (!response) {
          return new app.Result(`Unspecified status code: ${result.statusCode}`, 500);
        } else if (!response.content) {
          if (!result.content) return result;
          return new app.Result('Invalid result content (Should be empty)', 500);
        } else if (!result.content) {
          return new app.Result('Invalid result content (Should be populated)', 500);
        } else if (Buffer.isBuffer(result.content) || typeof result.content === 'function') {
          return result;
        } else if (!this._ajv.validateResponse(this._operation, response.key, result.content)) {
          return new app.Result(`Response validation failed: ${this._ajv.errorText}`, 500);
        } else {
          return result;
        }
      }
    } catch (error) {
      const message = String(error && error.stack);
      return new app.Result(message, 500);
    }
  }

  private _find(key: string) {
    if (this._operation.responses[key]) {
      const response = this._ajv.resolve(this._operation.responses[key]);
      return {key, ...response};
    } else if (this._operation.responses['default']) {
      const response = this._ajv.resolve(this._operation.responses['default']);
      return {key, ...response};
    } else {
      return {key};
    }
  }

  private _process(context: app.Context) {
    if (this._operation.parameters) {
      for (const unresolvedParameter of this._ajv.resolve(this._operation.parameters)) {
        const parameter = this._ajv.resolve(unresolvedParameter);
        const parameterSchema = this._ajv.resolve(parameter.schema);
        if (parameterSchema && parameterSchema.type) {
          const container = (context as any)[parameter.in];
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
