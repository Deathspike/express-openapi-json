export class Result {
  private readonly _content?: any;
  private readonly _statusCode: number;

  constructor(statusCode: number, content?: any) {
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
