import * as app from '..';
import * as express from 'express';
import * as http from 'http';
import * as regexp from 'path-to-regexp';

export class Router {
  private readonly _handlers: {[method: string]: [regexp.MatchFunction, app.IOperationHandler][]} = {};
  private readonly _operationModifier?: app.IOperationModifier;

  constructor(operationModifier?: app.IOperationModifier) {
    this._operationModifier = operationModifier;
  }

  add(method: string, path: string, operationHandler: app.IOperationHandler) {
    const lowerCaseMethod = method.toLowerCase();
    if (!this._handlers[lowerCaseMethod]) this._handlers[lowerCaseMethod] = [];
    this._handlers[lowerCaseMethod].push([regexp.match(path.replace(/{(.+?)}/g, ':$1')), operationHandler]);
  }

  async execAsync(method: string, path: string, context: app.Context) {
    const lowerCaseMethod = method.toLowerCase();
    if (this._handlers[lowerCaseMethod]) {
      for (const [matcher, operationHandler] of this._handlers[lowerCaseMethod]) {
        const match = matcher(path);
        const result = match && await operationHandler(context.withPath(match.params));
        const response = result && this._operationModifier ? await this._operationModifier(result) : result;
        if (response) return response;
      }
    }
    return app.status(404);
  }

  express() {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const result = await this.execAsync(req.method, req.path, app.Context.express(req));
        if (Buffer.isBuffer(result.content)) {
          copyHeaders(result, res);
          res.status(result.statusCode);
          res.send(result.content);
        } else if (typeof result.content === 'function') {
          copyHeaders(result, res);
          res.status(result.statusCode);
          await result.content(req, res);
        } else {
          copyHeaders(result, res);
          res.status(result.statusCode);
          res.json(result.content);
        }
      } catch (error) {
        next(error);
      }
    };
  }

  node() {
    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const context = await app.Context.nodeAsync(req);
        const result = await this.execAsync(req.method!, context.path, context);
        if (Buffer.isBuffer(result.content)) {
          copyHeaders(result, res);
          res.statusCode = result.statusCode;
          res.write(result.content);
          res.end();
        } else if (typeof result.content === 'function') {
          copyHeaders(result, res);
          res.statusCode = result.statusCode;
          await result.content(req, res);
        } else if (result.content == null) {
          copyHeaders(result, res);
          res.statusCode = result.statusCode;
          res.end();
        } else {
          copyHeaders(result, res);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = result.statusCode;
          res.write(JSON.stringify(result.content));
          res.end();
        }
      } catch (error) {
        res.statusCode = 500;
        res.write(String(error && error.stack));
        res.end();
      }
    };
  }
}

function copyHeaders<T>(result: app.Result<T>, res: http.ServerResponse) {
  for (const key in result.headers) {
    const value = result.headers[key];
    res.setHeader(key, value);
  }
}
