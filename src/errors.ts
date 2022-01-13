/** custom error object for network errors */
export class NetworkError extends Error {
  constructor(public readonly parent: Error) {
    super(parent.message); // 'Error' breaks prototype chain here for ES5/CommonJS builds
    this.name = "NetworkError";
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** custom error object for GE API errors */
export class EndpointError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly method: string,
    public readonly uri: string,
    message: string,
  ) {
    super(message); // 'Error' breaks prototype chain here for ES5/CommonJS builds
    this.name = "EndpointError";
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
