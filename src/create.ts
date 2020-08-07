import * as app from '.';
import * as apx from './internal';

export function createValidationContext(openapi: app.IOpenApi) {
  const validationContext: app.IValidationContext = {components: {}, requests: {}, responses: {}};
  const ajv = new apx.Ajv(validationContext);
  validationContext.components.schemas = openapi.components && openapi.components.schemas;
  parse(ajv, openapi, validationContext);
  return validationContext;
}

function parse(ajv: apx.Ajv, openapi: app.IOpenApi, validationContext: app.IValidationContext) {
  for (const path in openapi.paths) {
    for (const method in openapi.paths[path]) {
      const operation = ajv.resolve(openapi.paths[path][method]);
      parseOperationRequestSchema(ajv, operation, validationContext);
      parseOperationResponseSchemas(ajv, operation, validationContext);
    }
  }
}

function parseOperationRequestSchema(ajv: apx.Ajv, operation: app.IOpenApiOperation, validationContext: app.IValidationContext) {
  if (operation.operationId && (operation.parameters || operation.requestBody)) {
    const requestSchemaName = ajv.nameRequest(operation);
    const requestSchema: app.IOpenApiSchema = {};
    validationContext.requests[requestSchemaName] = requestSchema;
    if (operation.parameters) {
      const parameters = ajv.resolve(operation.parameters);
      for (const unresolvedParameter of parameters) {
        const parameter = ajv.resolve(unresolvedParameter);
        const parameterSchema = ajv.resolve(parameter.schema);
        validateParameterConstraints(parameter.name, parameterSchema);
        registerSchemaContainer(parameter.in, true, requestSchema);
        requestSchema.properties![parameter.in]!.properties![parameter.name] = parameter.schema!; // Unresolved
        if (parameter.required) requestSchema.properties![parameter.in]!.required!.push(parameter.name);
      }
    }
    if (operation.requestBody) {
      const requestBody = ajv.resolve(operation.requestBody);
      const content = ajv.resolve(requestBody.content);
      const contentJson = ajv.resolve(content['application/json']);
      if (contentJson && contentJson.schema) {
        const required = requestBody.required || false;
        registerSchemaContainer('requestBody', required, requestSchema);
        requestSchema.properties!['requestBody'] = contentJson.schema; // Unresolved
      }
    }
  }
}

function parseOperationResponseSchemas(ajv: apx.Ajv, operation: app.IOpenApiOperation, validationContext: app.IValidationContext) {
  if (operation.operationId) {
    for (const responseKey in operation.responses) {
      let response = ajv.resolve(operation.responses[responseKey]);
      if (response.content) {
        const content = ajv.resolve(response.content);
        const contentJson = content['application/json'];
        if (contentJson && contentJson.schema) {
          const responseSchemaName = ajv.nameResponse(operation, responseKey);
          const responseSchema = contentJson.schema; // Unresolved
          validationContext.responses[responseSchemaName] = responseSchema;
        }
      }
    }
  }
}

function registerSchemaContainer(name: string, required: boolean, schema: app.IOpenApiSchema) {
  if (!schema.required) schema.required = [];
  if (!schema.required.includes(name) && required) schema.required.push(name);
  if (!schema.properties) schema.properties = {};
  if (!schema.properties[name]) schema.properties[name] = {type: 'object', required: [], properties: {}};
}

function validateParameterConstraints(name: string, schema?: app.IOpenApiSchema) {
  if (!schema) throw new Error(`Unspecified schema: ${name}`);
  if (!schema.type) throw new Error(`Unspecified schema type: ${name}`);
  if (!['boolean', 'integer', 'number', 'string'].includes(schema.type)) throw new Error(`Invalid schema type: ${name}`);  
}
