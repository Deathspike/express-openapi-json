import * as ajv from 'ajv';
import * as app from '../..';
const requestSuffix = 'Context';
const responseSuffix = 'Response';

export class Ajv {
  private readonly _ajv: ajv.Ajv;

  constructor(validationContext: app.IValidationContext) {
    this._ajv = ajv.default({removeAdditional: 'all', useDefaults: true});
    this._ajv.addSchema(validationContext);
  }

  get errorText() {
    return this._ajv.errorsText(this._ajv.errors);
  }

  nameRequest(operation: app.IOpenApiOperation) {
    if (!operation.operationId) throw new Error('Unspecified operation identifier');
    return pascalCase(operation.operationId) + requestSuffix;
  }

  nameResponse(operation: app.IOpenApiOperation, responseKey: string) {
    if (!operation.operationId) throw new Error('Unspecified operation identifier');
    const keySuffix = responseKey !== '200' ? pascalCase(responseKey) : '';
    return pascalCase(operation.operationId) + keySuffix + responseSuffix;
  }

  resolve<T>(value: T): T {
    const reference = value && (value as any).$ref;
    const validator = reference && this._ajv.getSchema(reference);
    if (validator && validator.schema) return this.resolve(validator.schema as any);
    return value;
  }

  validateRequest<T>(operation: app.IOpenApiOperation, value: T) {
    const name = this.nameRequest(operation);
    const reference = `#/requests/${name}`;
    return this._ajv.validate(reference, value);
  }

  validateResponse<T>(operation: app.IOpenApiOperation, responseKey: string, value: T) {
    const name = this.nameResponse(operation, responseKey);
    const reference = `#/responses/${name}`;
    return this._ajv.validate(reference, value);
  }
}

function pascalCase(value: string) {
  return value.charAt(0).toUpperCase() + value.substr(1);
}
