import * as app from '..';
import * as express from 'express';
import * as regexp from 'path-to-regexp';

export class Router {
  private readonly _handlers: {[method: string]: [regexp.MatchFunction, app.IOperationHandler][]} = {};

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
        if (match) return await operationHandler(context.withPath(match.params));
      }
    }
    return new app.Result(undefined, 404);
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
}

function copyHeaders<T>(result: app.Result<T>, res: express.Response) {
  for (const key in result.headers) {
    const value = result.headers[key];
    res.setHeader(key, value);
  }
}
