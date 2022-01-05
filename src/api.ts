import type {
  IBaseStationRoot,
  IElementRoot,
  IEventRoot,
  IEventsItem,
} from "./model";
import { RequestBase, url, urlParams } from "./requestHelper";
import { EndpointError } from "./errors";
import { getSafeTimestampString } from "./utils";

export interface IGigasetElementsApiOptions {
  /** GE cloud login email address */
  email: string;
  /** GE cloud login password */
  password: string;
  /** automatically (re-) authorize against api after X hours */
  authorizeHours?: number;
  /** logging function for raw api requests */
  requestLogger?: (message: string) => void;
}

/** Authorization decorator automatically (re-)authorizes before api requests if required */
function Authorize(
  target: GigasetElementsApi,
  title: string,
  descriptor: PropertyDescriptor,
) {
  const orig = descriptor.value;
  descriptor.value = async function (...args: unknown[]) {
    const api = this as unknown as GigasetElementsApi;
    if (api.needsAuth()) await api.authorize();
    try {
      return await orig.apply(this, args);
    } catch (err) {
      if (err instanceof EndpointError && err.statusCode === 401) {
        api.requestLogger(
          "Caught 401 in AuthorizeDecorator - calling authorize and retrying",
        );
        await api.authorize();
        return await orig.apply(this, args);
      }
      throw err;
    }
  };
}

/** Class for interfacing with GE cloud api */
export class GigasetElementsApi extends RequestBase {
  private readonly options: IGigasetElementsApiOptions;
  private nextAuth: number | undefined = undefined;

  public constructor(options: IGigasetElementsApiOptions) {
    super(options.requestLogger);

    // set default options/copy config object
    this.options = {
      authorizeHours: 6,
      ...options,
    };

    // check options
    if (options.authorizeHours !== undefined && options.authorizeHours < 0)
      throw new Error("authorizeHours may not be a negative number");

    // initialize nextAuth
    if (options.authorizeHours) this.nextAuth = Date.now() - 1;
  }

  /** whether GE cloud is in maintenance mode and currently not available */
  public async isMaintenance() {
    const result = await this.get<{ isMaintenance: boolean }>(url.status);
    return result.isMaintenance;
  }

  /**
   * Authorize against the GE cloud. Retrieves and stores authorization cookie for further api requests
   */
  public async authorize() {
    await this.post(url.login, {
      form: {
        email: this.options.email,
        password: this.options.password,
      },
    });
    await this.get(url.auth);

    if (this.nextAuth)
      this.nextAuth =
        Date.now() + (this.options.authorizeHours || 0) * 60 * 60 * 1000;

    return true;
  }

  /**
   * Whether authorization is due
   */
  public needsAuth() {
    return !!this.nextAuth && Date.now() >= this.nextAuth;
  }

  /**
   * Retrieve base station and sensor data.
   * Automatically handles authorization if required.
   */
  @Authorize
  public getBaseStations(): Promise<IBaseStationRoot> {
    return this.get<IBaseStationRoot>(url.basestations);
  }

  /**
   * Retrieves elements, including sensor data (i.e. temperature for universal sensor).
   * Automatically handles authorization if required.
   */
  @Authorize
  public getElements(): Promise<IElementRoot> {
    return this.get<IElementRoot>(url.elements);
  }

  /**
   * Retrieves the most recent events that occured until a given point in time.
   * Events are sorted by timestamp in descending order.
   * Only the most recent *limit* number of events will be returned.
   * @param until date back to when to retrieve events
   * @param limit (optional) number of items to retrieve, default 500
   */
  @Authorize
  public getRecentEvents(
    until: Date | number,
    limit = 500,
  ): Promise<IEventRoot> {
    const params = new URLSearchParams();
    params.set(urlParams.events.from, getSafeTimestampString(until));
    if (limit && limit > 0)
      params.set(urlParams.events.limit, getSafeTimestampString(limit));

    return this.get<IEventRoot>(url.events + "?" + params.toString());
  }

  /**
   * Retrieves events that occured during a time period.
   * Events are sorted by timestamp in descending order.
   * Limit is applied from the end of the period.
   * @param from date back to when to retrieve events
   * @param to date from when on retrieve events
   * @param limit (optional) number of items to retrieve, default 500
   */
  @Authorize
  public getEvents(
    from: Date | number,
    to: Date | number,
    limit = 500,
  ): Promise<IEventRoot> {
    const params = new URLSearchParams();
    params.set(urlParams.events.from, getSafeTimestampString(from));
    params.set(urlParams.events.to, getSafeTimestampString(to));
    if (limit && limit > 0)
      params.set(urlParams.events.limit, getSafeTimestampString(limit));

    return this.get<IEventRoot>(url.events + "?" + params.toString());
  }

  /**
   * Utility method to retrieves all events that occured during a time period,
   * using multiple requests if more than *batchSize* events occured in this period.
   * Events are sorted by timestamp in descending order.
   * @param from date back to when to retrieve events
   * @param to (optional) date from when backwards to retrieve events, defaults to now
   * @param batchSize (optional) number of items to retrieve during each request, default/max 500
   */
  @Authorize
  public async getAllEvents(
    from: Date | number,
    to?: Date | number,
    batchSize = 500,
  ): Promise<IEventsItem[]> {
    if (!to) to = new Date().valueOf();
    if (batchSize > 500) batchSize = 500;

    let allEvents: IEventsItem[] = [];
    let result: IEventRoot;

    // load items in multiple batches, in reverse order
    do {
      result = await this.getEvents(from, to, batchSize);
      if (result.events?.length > 0) {
        allEvents = allEvents.concat(result.events);
        to =
          Number.parseInt(result.events[result.events.length - 1].ts, 10) - 1;
      }
    } while (result.events?.length === batchSize);

    return allEvents;
  }
}
