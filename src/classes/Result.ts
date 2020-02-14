export class Result<T> {
  private readonly _content?: T;
  private readonly _statusCode: number;

  constructor(statusCode: number, content?: T) {
    this._content = content;
    this._statusCode = statusCode;
  }

  get content() {
    return this._content;
  }
  
  get statusCode() {
    return this._statusCode;
  }
}
