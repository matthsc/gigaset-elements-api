import * as requestNonPromise from "request";
import * as requestPromise from "request-promise-native";
import { EndpointError, NetworkError } from "./errors";

/** GE api urls */
export const url = Object.freeze({
  status: "https://status.gigaset-elements.de/api/v1/status",
  login: "https://im.gigaset-elements.de/identity/api/v1/user/login",
  auth: "https://api.gigaset-elements.de/api/v1/auth/openid/begin?op=gigaset",
  basestations: "https://api.gigaset-elements.de/api/v1/me/basestations",
  elements: "https://api.gigaset-elements.de/api/v2/me/elements",
  events: "https://api.gigaset-elements.de/api/v2/me/events",
});

/** GE api url query parameter */
export const urlParams = Object.freeze({
  events: Object.freeze({
    limit: "limit",
    from: "from_ts",
    to: "to_ts",
  }),
});

/** base class for handling http requests */
export class RequestBase {
  /** logging of raw requests */
  public readonly requestLogger: (...messages: string[]) => void;

  /** internal request object */
  protected readonly request: requestNonPromise.RequestAPI<
    requestPromise.RequestPromise<requestPromise.FullResponse>,
    requestPromise.RequestPromiseOptions,
    requestPromise.OptionsWithUrl
  >;
  /** cookie jar for the current class instance */
  protected readonly jar: requestNonPromise.CookieJar;

  /**
   * constructor
   * @param options default request options
   */
  public constructor(
    requestLogger?: (message: string) => void,
    options?: requestPromise.RequestPromiseOptions,
  ) {
    this.requestLogger = requestLogger
      ? (...messages: string[]) => {
          requestLogger(messages.join(" "));
        }
      : () => {
          // do nothing
        };

    this.jar = requestPromise.jar();
    this.request = requestPromise.defaults({
      simple: false,
      resolveWithFullResponse: true,
      jar: this.jar,
      ...(options || {}),
    });
  }

  /**
   * Helper function to make http requests
   * @param method http method
   * @param uri uri to request
   * @param options request options
   */
  private async makeRequest<T>(
    method: "get" | "post",
    uri: string,
    options?: requestPromise.RequestPromiseOptions,
  ) {
    let response: requestPromise.FullResponse;
    try {
      this.requestLogger(method, uri);
      response = await this.request[method](uri, options);
    } catch (err: unknown) {
      throw new NetworkError(err as Error);
    }

    const body: T = response.body ? JSON.parse(response.body) : undefined;
    this.requestLogger(response.statusCode.toString(), response.body);
    if (response.statusCode !== 200)
      throw new EndpointError(
        response.statusCode,
        method.toUpperCase(),
        uri,
        response.body,
      );
    return body;
  }

  /**
   * Helper function to perform GET requests
   * @param uri uri to request
   */
  public async get<T = unknown>(uri: string) {
    return this.makeRequest<T>("get", uri);
  }

  /**
   * Helper function to perform POST requests
   * @param uri uri to request
   * @param bodyOrForm request body or form data
   */
  public async post<T = unknown>(
    uri: string,
    bodyOrForm: { body?: unknown; form?: string | object } = {},
  ) {
    // sanitize body - if it is an object, stringify it
    if (bodyOrForm.body && typeof bodyOrForm.body !== "string")
      bodyOrForm.body = JSON.stringify(bodyOrForm.body);

    return this.makeRequest<T>("post", uri, bodyOrForm);
  }
}
