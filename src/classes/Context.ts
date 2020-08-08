import * as express from 'express';
import * as http from 'http';
import * as querystring from 'querystring';

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

  static async nodeAsync(req: http.IncomingMessage) {
    const cookie = {};
    const header = req.headers;
    const incomingUrl = new URL(req.url!, `http://localhost`);
    const path = incomingUrl.pathname;
    const query = querystring.parse(incomingUrl.search.replace(/^\?/, ''));
    const requestBody = await readAsync(req);
    return new Context({cookie, header, path, query, requestBody});
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

async function readAsync(req: http.IncomingMessage) {
  return new Promise((resolve, reject) => {
    const requestBody = [] as any[];
    req.on('error', (error) => reject(error));
    req.on('data', (chunk) => requestBody.push(chunk));
    req.on('end', () => resolve(tryJson(Buffer.concat(requestBody).toString())));
  });
}

function tryJson(body: string) {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}
