const api = require('../dist');
const fs = require('fs');
const json2ts = require('json-schema-to-typescript');

const contents = fs.readFileSync(process.argv[2], 'utf8');
const definitions = {};
const properties = {};
const validationContext = api.createValidationContext(JSON.parse(contents));

[validationContext.components.schemas, validationContext.requests, validationContext.responses].forEach((values) => {
  for (const propertyName in values) {
    if (definitions[propertyName]) throw new Error(`Duplicate definition: ${propertyName}`);
    definitions[propertyName] = values[propertyName];
    properties[propertyName] = {$ref: `#/definitions/${propertyName}`};
    update(true, definitions[propertyName]);
  }
});

function update(isRoot, schema) {
  if (schema.$ref) {
    schema.$ref = schema.$ref.replace(/^#\/components\/schemas\/(.*)$/, '#/definitions/$1');
  } else if (Array.isArray(schema)) {
    schema.forEach(update);
  } else if (typeof schema === 'object') {
    Object.keys(schema).forEach(x => update(false, schema[x]));
    if (isRoot || typeof schema.type === 'string') {
      schema.additionalProperties = false;
    }
  }
}

json2ts.compile({properties, definitions}, '').then((result) => {
  console.log(result);
});
