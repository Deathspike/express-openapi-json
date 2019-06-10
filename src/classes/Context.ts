import * as express from 'express';

export class Context {
  constructor(req: express.Request) {
    this.cookie = req.cookies;
    this.header = req.headers;
    this.path = req.params;
    this.query = req.query;
    this.requestBody = req.body;
  }

  readonly cookie: any;
  readonly header: any;
  readonly path: any;
  readonly query: any;
  readonly requestBody: any;
}
