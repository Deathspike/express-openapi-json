import * as express from 'express';

export class Context {
  constructor(context: {cookie?: any, header?: any, path?: any, query?: any, requestBody?: any}) {
    this.cookie = context?.cookie;
    this.header = context?.header;
    this.path = context?.path;
    this.query = context?.query;
    this.requestBody = context?.requestBody;
  }

  static express(req: express.Request) {
    const cookie = req.cookies;
    const header = req.headers;
    const query = req.query;
    const requestBody = req.body;
    return new Context({cookie, header, query, requestBody});
  }

  withPath(path: any) {
    const cookie = this.cookie;
    const header = this.header;
    const query = this.query;
    const requestBody = this.requestBody;
    return new Context({cookie, header, path, query, requestBody});
  }

  readonly cookie: any;
  readonly header: any;
  readonly path: any;
  readonly query: any;
  readonly requestBody: any;
}
