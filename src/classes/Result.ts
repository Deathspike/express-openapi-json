export class Result<T> {
  private readonly _content?: T;
  private readonly _contentType?: string;
  private readonly _statusCode: number;

  constructor(statusCode: number, content?: T, contentType?: string) {
    this._content = content;
    this._contentType = contentType;
    this._statusCode = statusCode;
  }

  get content() {
    return this._content;
  }

  get contentType() {
    return this._contentType;
  }
  
  get statusCode() {
    return this._statusCode;
  }
}
