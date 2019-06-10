import ajv from 'ajv';
import * as api from '..';
const referenceRoot = 'openapi.json';

export class Ajv {
  private readonly _ajv: ajv.Ajv;

  constructor(openapi: api.IOpenApi) {
    this._ajv = ajv({removeAdditional: 'all', useDefaults: true});
    this._ajv.addSchema(openapi, referenceRoot);
  }

  get errorText() {
    return this._ajv.errorsText(this._ajv.errors);
  }

  nameRequest(operation: api.IOpenApiOperation) {
    if (!operation.operationId) throw new Error('Unspecified operation identifier');
    return `__${operation.operationId}.request`;
  }

  nameResponse(operation: api.IOpenApiOperation, responseKey: string) {
    if (!operation.operationId) throw new Error('Unspecified operation identifier');
    return `__${operation.operationId}.response.${responseKey}`;
  }

  resolve<T>(value: T): T {
    const reference = value && api.unsafe(value).$ref;
    const resolved = reference && this._ajv.getSchema(reference);
    if (resolved && resolved.schema) return this.resolve(api.unsafe(resolved.schema));
    return value;
  }

  validateRequest<T>(operation: api.IOpenApiOperation, value: T) {
    const schemaName = this.nameRequest(operation);
    const schemaReference = `${referenceRoot}#/components/schemas/${schemaName}`;
    return this._ajv.validate(schemaReference, value);
  }

  validateResponse<T>(operation: api.IOpenApiOperation, responseKey: string, value: T) {
    const schemaName = this.nameResponse(operation, responseKey);
    const schemaReference = `${referenceRoot}#/components/schemas/${schemaName}`;
    return this._ajv.validate(schemaReference, value);
  }
}
