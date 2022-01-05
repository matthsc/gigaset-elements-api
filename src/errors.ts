/** custom error object for network errors */
export class NetworkError extends Error {
  constructor(public readonly parent: Error) {
    super(parent.message);
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
    super(message);
  }
}
