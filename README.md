# ExpressJS + OpenAPI + JSON = <3

Builds an express-compatible router using `OpenAPI` with request and response validation.

## Assumptions

* Your `ExpressJS` server includes `body-parser` and `cookie-parser` when applicable.
* Your `OpenAPI` document is version `3.0` and valid (See https://editor.swagger.io/).
* Your `OpenAPI` document consumes `application/json` and produces `application/json`.
* Your `OpenAPI` document operations declare an  `operationId`.

## Installation

Install `express-openapi-json`:

```
npm install express-openapi-json
```

## Quick Start

Create a router with one operation for the specified `operationId`:

```js
const router = api.createCore(require('./openapi.json'))
  .operation('getUserById', ctx => api.json({id: ctx.query.id})))
  .router();
```

Create a router with one controller (using `decorators`):

```js
class PersonController {
  @api.createOperation('getUser')
  get(context) {
    return api.json({id: context.query.id});
  }
}

const router = api.createCore(require('./openapi.json'))
  .controller(new PersonController())
  .router();
```

Using the router in `express`:

```js
app.use(router.express());
```

Using the router in `express` mounted under `/api`:

```js
app.use('/api', router.express());
```

## Full Example

```js
import api from 'express-openapi-json';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';

class UserController {
  @api.createOperation('getUser')
  get(context) {
    return api.json({id: context.query.id});
  }

  @api.createOperation('postUser')
  post(context) {
    return api.status(200);
  }
}

const router = api.createCore(require('./openapi.json'))
  .controller(new UserController())
  .router();

const server = express();
server.use(bodyParser.json());
server.use(cookieParser());
server.use(router.express());
server.listen(3000);
```

# Scripts

Certain scripts are made available after package installation.

## openapi2ts

Converts an `openapi` document to `TypeScript` definitions. Limitations:

* Your `OpenAPI` document must be stored as `json`.

Installation:

    npm install json-schema-to-typescript --save-dev

Usage:

    openapi2js your_openapi.json > your_typescript.ts

# OpenAPI

This section describes the supported features and limitations.

## Paths

    {
      paths: {
        [Path]: {
          [method]: Operation = {
            parameters?: Parameter[],
            requestBody?: RequestBody
            responses: {
              [responseKey]: Response
            }
          }
        }
      }
    }

### Path

Supported.

### Parameter (Operation)

Supported with validation (including `required`). Limitations:

* Parameter **MUST** have a `schema` or `$ref`. See [Schema](#Schema).
* Parameter **MUST** have a `schema.type` that is a primitive:
  * `boolean` (`/^(1|0|true|false|yes|no)$/i`)
  * `integer` (`/^[0-9]+$/`)
  * `number` (`/^[0-9]+(\.[0-9]+)?$/`)
  * `string`

### RequestBody (Operation)

Supported with validation. Limitations:

* Content **MUST** have a `contentType` = `application/json`.
* Content **MUST** have a `schema` for `application/json`. See [Schema](#Schema).

### Response (Operation)

Supported. See [Components](#Components).

## Components

    {
      components: {
        responses?: {
          [responseName]: Response = {
            headers?: Headers
            content?: Content
          }
        }
        schemas?: {
          [schemaName]: Schema
        }
      }
    }

### Headers (Response)

Unsupported.

### Content (Response)

Supported with validation. Limitations:

* Content **SHOULD** have a `contentType` = `application/json`.
* Content **MUST** have a `schema` for `application/json`. See [Schema](#Schema).
