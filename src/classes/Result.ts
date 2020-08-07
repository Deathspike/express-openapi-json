export class Result<T> {
  private readonly _content?: T;
  private readonly _headers?: {[key: string]: string};
  private readonly _statusCode?: number;

  constructor(content?: T, statusCode?: number, headers?: {[key: string]: string}) {
    this._content = content;
    this._headers = headers;
    this._statusCode = statusCode;
  }

  get content() {
    return this._content;
  }
  
  get headers() {
    return this._headers || {};
  }

  get statusCode() {
    return this._statusCode || 200;
  }
}
