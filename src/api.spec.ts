/* eslint-disable @typescript-eslint/no-unused-vars */
import { IEventRoot, IEventsItem } from "./model";
import { assert, use as chaiUse } from "chai";
import { url, urlParams } from "./requestHelper";
import { GigasetElementsApi } from "./api";
import chaiAsPromised from "chai-as-promised";
import nock = require("nock");
import sinon = require("sinon");
import { loadEvents } from "../test-data/data-loader";

chaiUse(chaiAsPromised);

/** helper method to split a url into domain and path, i.e. http://example.com/test => [http://example.com, /test] */
function splitDomainAndPath(uri: string) {
  const index = uri.indexOf("/", "https://".length);
  const domain = uri.substring(0, index);
  const path = uri.substring(index);
  return [domain, path];
}
/** helper method to split a url path into path and query, i.e. /test?alpha=1 => [/test, alpha=1] */
function splitPathAndQuery(path: string) {
  return path.split("?");
}
/** helper method to create a nock interceptor */
function createInterceptor(
  uri: string,
  method: "get" | "post",
  body?: nock.RequestBodyMatcher,
) {
  const [domain, path] = splitDomainAndPath(uri);
  return nock(domain)[method](path, body);
}
/** helper method to create a nock interceptor for GET requests */
function getInterceptor(uri: string) {
  return createInterceptor(uri, "get");
}
/** helper method to create a nock interceptor for POST requests */
function postInterceptor(uri: string, body?: nock.RequestBodyMatcher) {
  return createInterceptor(uri, "post", body);
}

function ensureSortedEvents(events: IEventsItem[]) {
  for (let i = 1; i < events.length; i++)
    if (events[i - 1].ts < events[i].ts)
      assert.fail("events should be sorted descending");

  assert.isTrue(true);
}

describe("api.spec helper methods", () => {
  it("splitDomainAndPath", () => {
    const domainTest = "https://www.example.com";
    const pathTest = "/api/v1/test";
    const [domain, path] = splitDomainAndPath(domainTest + pathTest);
    assert.equal(domain, domainTest);
    assert.equal(path, pathTest);
  });

  it("splitPathAndQuery", () => {
    const pathTest = "/api/v2/test";
    const queryTest = "filter=asd";
    const [path, query] = splitPathAndQuery(pathTest + "?" + queryTest);
    assert.equal(path, pathTest);
    assert.equal(query, queryTest);
  });
});

describe("api.isMaintenance", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });

  afterEach(() => {
    nock.cleanAll();
  });

  for (const status of [true, false])
    it("returns maintenance status " + status, async () => {
      const scope = getInterceptor(url.status).reply(200, {
        isMaintenance: status,
      });
      const result = await api.isMaintenance();
      assert.isTrue(scope.isDone());
      assert.equal(result, status);
    });
});

describe("api.authorize", () => {
  const email = "auth@test.net";
  const password = "P@ssw0rd";
  const authorizeHours = 2;
  const date = new Date(2019, 0, 1, 0, 0, 0, 0);
  let clock: sinon.SinonFakeTimers;
  let api: GigasetElementsApi;

  beforeEach(() => {
    clock = sinon.useFakeTimers(date);
    api = new GigasetElementsApi({ email, password, authorizeHours });
  });
  afterEach(() => {
    nock.cleanAll();
    clock.restore();
  });

  function getAuthScopes() {
    return [
      postInterceptor(url.login, { email, password }).reply(200),
      getInterceptor(url.auth).reply(200),
    ];
  }
  function expectScopes(scopes: nock.Scope[]) {
    for (const scope of scopes) assert.isTrue(scope.isDone());
  }
  function getNextAuth(): number {
    return (api as unknown as { nextAuth: number }).nextAuth;
  }

  it("calls auth and login urls", async () => {
    const scopes = getAuthScopes();
    const result = await api.authorize();

    expectScopes(scopes);
    assert.isTrue(result);
  });

  it("throws if authorizeHours is < 0", () => {
    // tslint:disable-next-line:no-shadowed-variable
    for (const authorizeHours of [Number.MIN_SAFE_INTEGER, -1000, -1]) {
      try {
        api = new GigasetElementsApi({ email, password, authorizeHours });
        assert(false);
      } catch {
        assert(true);
      }
    }
  });

  it("doesn't update nextAuth field if options.authorizeHours is 0 or undefined", async () => {
    // tslint:disable-next-line:no-shadowed-variable
    for (const authorizeHours of [0, undefined]) {
      api = new GigasetElementsApi({ email, password, authorizeHours });
      assert.isUndefined(getNextAuth());
      const scopes = getAuthScopes();
      await api.authorize();
      assert.isUndefined(getNextAuth());
    }
  });

  it("updates nextAuth field", async () => {
    async function expectNextAuth(tick: string | number) {
      clock.tick(tick);
      getAuthScopes();
      await api.authorize();
      const nextDate = new Date(clock.now);
      nextDate.setHours(nextDate.getHours() + authorizeHours);
      assert.equal(getNextAuth(), nextDate.valueOf());
    }

    await expectNextAuth(1);
    await expectNextAuth(5);
    await expectNextAuth("01:00:00");
    await expectNextAuth("01:00:00");
    await expectNextAuth("00:00:05");
    await expectNextAuth("02:15:55");
  });

  it("is called by authorization decorator after authInterval has elapsed", async () => {
    const getOtherScope = () => getInterceptor(url.elements).reply(200);
    let authScopes = getAuthScopes();
    let otherScope = getOtherScope();
    await api.getElements();
    expectScopes([...authScopes, otherScope]);

    otherScope = getOtherScope();
    await api.getElements();
    expectScopes([otherScope]);

    clock.tick("01:00:00");
    otherScope = getOtherScope();
    await api.getElements();
    expectScopes([otherScope]);

    clock.tick("05:00:00");
    authScopes = getAuthScopes();
    otherScope = getOtherScope();
    await api.getElements();
    expectScopes([...authScopes, otherScope]);

    clock.tick("01:59:59");
    otherScope = getOtherScope();
    await api.getElements();
    expectScopes([otherScope]);

    clock.tick("00:00:01");
    authScopes = getAuthScopes();
    otherScope = getOtherScope();
    await api.getElements();
    expectScopes([...authScopes, otherScope]);
  });
});

describe("api.needsAuth", () => {
  it("");
});

describe("api.getBaseStations", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });

  afterEach(() => {
    nock.cleanAll();
  });

  it("calls base stations endpoint", async () => {
    const scope = getInterceptor(url.basestations).reply(200);
    await api.getBaseStations();
    assert.isTrue(scope.isDone());
  });

  it("implement tests"); // TODO
});

describe("api.getElements", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });

  afterEach(() => {
    nock.cleanAll();
  });

  it("calls elements endpoint", async () => {
    const scope = getInterceptor(url.elements).reply(200);
    await api.getElements();
    assert.isTrue(scope.isDone());
  });

  it("implement tests"); // TODO
});

describe("api.getRecentEvents", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });
  const date = new Date();
  let eventsData: unknown;

  before(async () => {
    eventsData = await loadEvents(true);
  });

  function createScope(events?: object[], homeState = "ok") {
    const [domain, pathAndQuery] = splitDomainAndPath(url.events);
    const [path, query] = splitPathAndQuery(pathAndQuery);
    const params = new URLSearchParams(query);
    params.set(urlParams.events.from, date.valueOf().toString());
    params.set(urlParams.events.limit, "500");

    return (
      getInterceptor(domain + path)
        // .query(new URLSearchParams(query + date.valueOf()))
        .query(params)
        .reply(
          200,
          events
            ? { events, home_state: homeState }
            : (eventsData as nock.Body),
        )
    );
  }

  afterEach(() => {
    nock.cleanAll();
  });

  it("accepts Date object", async () => {
    const scope = createScope();
    const result = await api.getRecentEvents(date);
    assert.isTrue(scope.isDone());
  });

  it("accepts number", async () => {
    const scope = createScope();
    const result = await api.getRecentEvents(date.valueOf());
    assert.isTrue(scope.isDone());
  });

  it("throws on invalid date object or number", () => {
    const invalids: Array<number | Date> = [
      new Date(NaN),
      new Date(Infinity),
      new Date("not-a-date"),
      -1,
      NaN,
      Infinity,
    ];
    for (const invalid of invalids) {
      // test from
      assert.isRejected(api.getRecentEvents(invalid));
      // test limit
      assert.isRejected(
        api.getRecentEvents(
          1,
          invalid instanceof Date ? invalid.valueOf() : invalid,
        ),
      );
    }
  });

  it("returns empty array if no events occured", async () => {
    const scope = createScope([]);
    const result = await api.getRecentEvents(date.valueOf());
    assert.isTrue(scope.isDone());
    assert.isObject(result);
    assert.isArray(result.events);
    assert.isString(result.home_state);
    assert.lengthOf(result.events, 0);
  });

  it("returns event array", async () => {
    const scope = createScope();
    const result = await api.getRecentEvents(date.valueOf());
    assert.isTrue(scope.isDone());
    assert.isObject(result);
    assert.isArray(result.events);
    assert.isAbove(result.events.length, 0);
  });

  it("returns sorted event array", async () => {
    const scope = createScope();
    const result = await api.getRecentEvents(date.valueOf());
    assert.isTrue(scope.isDone());
    assert.isArray(result.events);
    assert.isAbove(result.events.length, 2);
    ensureSortedEvents(result.events);
  });
});

describe("api.getEvents", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });
  const dateFrom = new Date();
  const dateTo = new Date();
  let eventsData: unknown;

  before(async () => {
    eventsData = await loadEvents(true);
  });

  function createScope(events?: object[], homeState = "ok") {
    const [domain, pathAndQuery] = splitDomainAndPath(url.events);
    const [path, query] = splitPathAndQuery(pathAndQuery);
    const params = new URLSearchParams(query);
    params.set(urlParams.events.from, dateFrom.valueOf().toString());
    params.set(urlParams.events.to, dateTo.valueOf().toString());
    params.set(urlParams.events.limit, "500");

    return (
      getInterceptor(domain + path)
        // .query(new URLSearchParams(query + date.valueOf()))
        .query(params)
        .reply(
          200,
          events
            ? { events, home_state: homeState }
            : (eventsData as nock.Body),
        )
    );
  }

  afterEach(() => {
    nock.cleanAll();
  });

  it("accepts Date object", async () => {
    const scope = createScope();
    const result = await api.getEvents(dateFrom, dateTo);
    assert.isTrue(scope.isDone());
  });

  it("accepts number", async () => {
    const scope = createScope();
    const result = await api.getEvents(dateFrom.valueOf(), dateTo.valueOf());
    assert.isTrue(scope.isDone());
  });

  it("throws on invalid date object or number", () => {
    const invalids: Array<number | Date> = [
      new Date(NaN),
      new Date(Infinity),
      new Date("not-a-date"),
      -1,
      NaN,
      Infinity,
    ];
    for (const invalid of invalids) {
      // test from
      assert.isRejected(api.getEvents(invalid, 1));
      // test to
      assert.isRejected(api.getEvents(1, invalid));
      // test limit
      assert.isRejected(
        api.getEvents(
          1,
          1,
          invalid instanceof Date ? invalid.valueOf() : invalid,
        ),
      );
    }
  });

  it("returns empty array if no events occured", async () => {
    const scope = createScope([]);
    const result = await api.getEvents(dateFrom, dateTo);
    assert.isTrue(scope.isDone());
    assert.isObject(result);
    assert.isArray(result.events);
    assert.isString(result.home_state);
    assert.lengthOf(result.events, 0);
  });

  it("returns event array", async () => {
    const scope = createScope();
    const result = await api.getEvents(dateFrom, dateTo);
    assert.isTrue(scope.isDone());
    assert.isObject(result);
    assert.isArray(result.events);
    assert.isAbove(result.events.length, 0);
  });

  it("returns sorted event array", async () => {
    const scope = createScope();
    const result = await api.getEvents(dateFrom, dateTo);
    assert.isTrue(scope.isDone());
    assert.isArray(result.events);
    assert.isAbove(result.events.length, 2);
    ensureSortedEvents(result.events);
  });
});

describe("api.getAllEvents", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });
  const defaultBatchSize = 500;
  let dateFrom: Date;
  let dateTo: Date;
  let eventsData: IEventRoot;

  before(async () => {
    eventsData = await loadEvents(true);

    dateTo = new Date(Number.parseInt(eventsData.events[0].ts, 10) + 1);
    dateFrom = new Date(
      Number.parseInt(eventsData.events[eventsData.events.length - 1].ts, 10) -
        1,
    );
  });

  function createScope() {
    const [domain, pathAndQuery] = splitDomainAndPath(url.events);
    const [path, query] = splitPathAndQuery(pathAndQuery);

    return getInterceptor(domain + path)
      .query(true) // match on all query parameters
      .reply(200, (urlString) => {
        const params = new URL(domain + urlString).searchParams;
        const limitParam = Number.parseInt(
          params.get(urlParams.events.limit) as string,
          10,
        );
        const fromParam = params.get(urlParams.events.from) as string;
        const toParam = params.get(urlParams.events.to) as string;

        let count = 0;
        const filteredEvents = eventsData.events.filter(
          (e) => e.ts <= toParam && e.ts >= fromParam && count++ < limitParam,
        );
        return { events: filteredEvents };
      })
      .persist();
  }

  afterEach(() => {
    nock.cleanAll();
  });

  it("accepts Date object", async () => {
    const scope = createScope();
    const result = await api.getAllEvents(dateFrom, dateTo, defaultBatchSize);
    assert.isTrue(scope.isDone());
  });

  it("accepts number", async () => {
    const scope = createScope();
    const result = await api.getAllEvents(
      dateFrom.valueOf(),
      dateTo.valueOf(),
      defaultBatchSize,
    );
    assert.isTrue(scope.isDone());
  });

  it("throws on invalid date object or number", () => {
    const invalids: Array<number | Date> = [
      new Date(NaN),
      new Date(Infinity),
      new Date("not-a-date"),
      -1,
      NaN,
      Infinity,
    ];
    for (const invalid of invalids) {
      // test from
      assert.isRejected(api.getAllEvents(invalid, 1));
      // test to
      assert.isRejected(api.getAllEvents(1, invalid));
      // test limit
      assert.isRejected(
        api.getAllEvents(
          1,
          1,
          invalid instanceof Date ? invalid.valueOf() : invalid,
        ),
      );
    }
  });

  it("returns empty array if no events occured", async () => {
    const dateArray: Array<[Date | number, Date | number]> = [
      [new Date(), new Date()],
      [1, dateFrom.valueOf() - 1],
      [dateTo.valueOf() + 1, Number.MAX_SAFE_INTEGER],
    ];
    const scope = createScope();
    for (const [from, to] of dateArray) {
      const events = await api.getAllEvents(from, to, defaultBatchSize);
      assert.isArray(events);
      assert.lengthOf(events, 0);
    }
    assert.isTrue(scope.isDone());
  });

  it("returns event array", async () => {
    const scope = createScope();
    const events = await api.getAllEvents(dateFrom, dateTo, defaultBatchSize);
    assert.isTrue(scope.isDone());
    assert.isArray(events);
    assert.isAbove(events.length, 0);
  });

  it("returns sorted event array", async () => {
    const scope = createScope();
    const events = await api.getAllEvents(dateFrom, dateTo, defaultBatchSize);
    assert.isTrue(scope.isDone());
    assert.isArray(events);
    assert.isAbove(events.length, 2);
    ensureSortedEvents(events);
  });

  for (const batchSize of [1, 2, 5, 10, 20]) {
    it(`returns same number of events when loading in one or multiple batches (batchSize: ${batchSize})`, async () => {
      const scope = createScope();
      const events1 = await api.getAllEvents(
        dateFrom,
        dateTo,
        defaultBatchSize,
      );
      const events2 = await api.getAllEvents(dateFrom, dateTo, batchSize);
      assert.equal(events1.length, events2.length, `batchSize: ${batchSize}`);
    });
  }

  it("returns sorted event array when loading in batches", async () => {
    const scope = createScope();
    const events = await api.getAllEvents(dateFrom, dateTo, 5);
    assert.isTrue(scope.isDone());
    assert.isArray(events);
    assert.isAbove(events.length, 2);
    assert.lengthOf(events, eventsData.events.length);
    ensureSortedEvents(events);
  });
});

describe("api.sendCommand", () => {
  const api = new GigasetElementsApi({ email: "", password: "" });
  const baseId = "baseId20";
  const endNodeId = "endNodeId3";

  function createScope() {
    const [domain, pathAndQuery] = splitDomainAndPath(
      url.cmd(baseId, endNodeId),
    );
    const [path, query] = splitPathAndQuery(pathAndQuery);
    const params = new URLSearchParams(query);

    return postInterceptor(domain + path, { name: "test" })
      .query(params)
      .reply(200);
  }

  afterEach(() => {
    nock.cleanAll();
  });

  it("sends a command", async () => {
    const scope = createScope();
    await api.sendCommand(baseId, endNodeId, "test");
    assert.isTrue(scope.isDone());
  });
});
