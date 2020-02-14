export class Result<T> {
  private readonly _content?: T;
  private readonly _contentType?: string;
  private readonly _fileName?: string;
  private readonly _statusCode: number;

  constructor(statusCode: number, content?: T, contentType?: string, fileName?: string) {
    this._content = content;
    this._contentType = contentType;
    this._fileName = fileName;
    this._statusCode = statusCode;
  }

  get content() {
    return this._content;
  }

  get contentType() {
    return this._contentType;
  }

  get fileName() {
    return this._fileName;
  }
  
  get statusCode() {
    return this._statusCode;
  }
}
