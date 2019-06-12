import * as ajv from 'ajv';
import * as api from '..';
const requestSuffix = 'Context';

export class Ajv {
  private readonly _ajv: ajv.Ajv;

  constructor(validationContext: api.IValidationContext) {
    this._ajv = ajv.default({removeAdditional: 'all', useDefaults: true});
    this._ajv.addSchema(validationContext);
  }

  get errorText() {
    return this._ajv.errorsText(this._ajv.errors);
  }

  nameRequest(operation: api.IOpenApiOperation) {
    if (!operation.operationId) throw new Error('Unspecified operation identifier');
    return api.pascalCase(operation.operationId) + requestSuffix;
  }

  nameResponse(operation: api.IOpenApiOperation, responseKey: string) {
    if (!operation.operationId) throw new Error('Unspecified operation identifier');
    const keySuffix = responseKey !== '200' ? api.pascalCase(responseKey) : '';
    return api.pascalCase(operation.operationId) + keySuffix;
  }

  resolve<T>(value: T): T {
    const reference = value && api.unsafe(value).$ref;
    const validator = reference && this._ajv.getSchema(reference);
    if (validator && validator.schema) return this.resolve(api.unsafe(validator.schema));
    return value;
  }

  validateRequest<T>(operation: api.IOpenApiOperation, value: T) {
    const name = this.nameRequest(operation);
    const reference = `#/requests/${name}`;
    return this._ajv.validate(reference, value);
  }

  validateResponse<T>(operation: api.IOpenApiOperation, responseKey: string, value: T) {
    const name = this.nameResponse(operation, responseKey);
    const reference = `#/responses/${name}`;
    return this._ajv.validate(reference, value);
  }
}
