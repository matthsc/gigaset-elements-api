import { EndpointError, NetworkError } from "./errors";
import { RequestBase, url, urlParams } from "./requestHelper";
import { assert } from "chai";
import nock from "nock";

interface RequestHelperUrlObject {
  [key: string]: string | (() => void);
}

describe("request helper url objects", () => {
  describe("- url", () => {
    it("exists", () => {
      assert.exists(url);
      assert.isObject(url);
    });

    for (const prop of ["basestations", "status", "login", "auth", "events"]) {
      it("contains url for " + prop, () => {
        assert.property(url, prop);
        assert.exists((url as unknown as RequestHelperUrlObject)[prop]);
        assert.isNotEmpty((url as unknown as RequestHelperUrlObject)[prop]);
      });
    }

    it("is frozen", () => {
      assert.isFrozen(url);
    });

    it("cannot be changed", (done) => {
      const doesNotExistProp = "doesNotExist";
      const test = "test123";
      try {
        (url as unknown as RequestHelperUrlObject)[doesNotExistProp] = test;
        assert.fail();
      } catch {
        // this is expected, nothing to do
      }
      assert.notExists(
        (url as unknown as RequestHelperUrlObject)[doesNotExistProp],
      );

      const existProp = "auth";
      const before = url.auth;
      try {
        (url as unknown as RequestHelperUrlObject)[existProp] = test;
        assert.fail();
      } catch {
        // this is expected, nothing to do
      }
      assert.equal(url.auth, before);
      done();
    });
  });

  describe("- urlParams", () => {
    it("exists", () => {
      assert.exists(urlParams);
      assert.isObject(urlParams);
    });
    it("is frozen", () => {
      assert.isFrozen(urlParams);
    });
    it("its properties are frozen", () => {
      for (const key of Object.keys(urlParams) as Array<keyof typeof urlParams>)
        assert.isFrozen(urlParams[key]);
    });
  });
});

describe("requestBase.get", () => {
  const uri = "http://example.com/api/v0/get";
  const returnObject = Object.freeze({ foo: true, bar: 200, void: "diov" });
  let interceptor: nock.Interceptor;

  beforeEach(() => {
    interceptor = nock("http://example.com").get("/api/v0/get");
  });
  afterEach(() => {
    nock.cleanAll();
  });

  it("performs a http GET request", async () => {
    const scope = interceptor.reply(200, {});
    await new RequestBase().get(uri);
    assert.isTrue(scope.isDone());
  });

  it("returns the GET response as JSON object", async () => {
    const scope = interceptor.reply(200, returnObject);
    const result = await new RequestBase().get(uri);
    assert.deepEqual(result, returnObject);
    assert.isTrue(scope.isDone());
  });

  it("can handle empty responses", async () => {
    const scope = interceptor.reply(200);
    await new RequestBase().get(uri);
    assert.isTrue(scope.isDone());
  });

  it("throws NetworkError on unknown exceptions", async () => {
    const message = "Unknown network error";
    const scope = interceptor.replyWithError(message);
    try {
      await new RequestBase().get(uri);
      assert.fail("no error thrown");
    } catch (err: unknown) {
      assert.isTrue(scope.isDone());
      assert.instanceOf(err, NetworkError);
      assert.include((err as Error).message, message);
    }
  });

  it("throws EndpointError on API errors", async () => {
    const body = { message: "Unauthorized" };
    const scope = interceptor.reply(401, body);
    try {
      await new RequestBase().get(uri);
      assert.fail("no error thrown");
    } catch (err: unknown) {
      assert.isTrue(scope.isDone());
      assert.instanceOf(err, EndpointError);
      assert.equal((err as Error).message, JSON.stringify(body));
    }
  });

  // TODO: check that cookie from authorization is included in get request
});

describe("requestBase.post", () => {
  const uri = "http://example.com/api/v0/post";
  const returnObject = Object.freeze({ foo: true, bar: 200, void: "diov" });

  function setupInterceptor(body?: nock.RequestBodyMatcher) {
    return nock("http://example.com").post("/api/v0/post", body);
  }
  afterEach(() => {
    nock.cleanAll();
  });

  it("performs a http POST request", async () => {
    const scope = setupInterceptor().reply(200, {});
    await new RequestBase().post(uri);
    assert.isTrue(scope.isDone());
  });

  it("returns the POST response as JSON object", async () => {
    const scope = setupInterceptor().reply(200, returnObject);
    const result = await new RequestBase().post(uri);
    assert.deepEqual(result, returnObject);
    assert.isTrue(scope.isDone());
  });

  it("sends the body", async () => {
    nock.cleanAll();
    const scope = setupInterceptor(returnObject).reply(200);
    await new RequestBase().post(uri, { body: returnObject });
    assert.isTrue(scope.isDone());
  });

  it("sends a form", async () => {
    nock.cleanAll();
    const scope = setupInterceptor("alpha=1&beta=test").reply(200);
    await new RequestBase().post(uri, { form: { alpha: 1, beta: "test" } });
    assert.isTrue(scope.isDone());
  });

  it("can handle empty responses", async () => {
    const scope = setupInterceptor().reply(200);
    await new RequestBase().post(uri);
    assert.isTrue(scope.isDone());
  });

  it("throws NetworkError on unknown exceptions", async () => {
    const message = "Unknown network error";
    const scope = setupInterceptor().replyWithError(message);
    try {
      await new RequestBase().post(uri);
      assert.fail("no error thrown");
    } catch (err: unknown) {
      assert.isTrue(scope.isDone());
      assert.instanceOf(err, NetworkError);
      assert.include((err as Error).message, message);
    }
  });

  it("throws EndpointError on API errors", async () => {
    const body = { message: "Unauthorized" };
    const scope = setupInterceptor().reply(401, body);
    try {
      await new RequestBase().post(uri);
      assert.fail("no error thrown");
    } catch (err: unknown) {
      assert.isTrue(scope.isDone());
      assert.instanceOf(err, EndpointError);
      assert.equal((err as Error).message, JSON.stringify(body));
    }
  });

  // TODO: check that cookie from authorization is included in post request
});

describe("requestBase request logging", () => {
  const url = "http://example.com";
  let requestBase: RequestBase;
  const logged: string[] = [];

  beforeEach(() => {
    requestBase = new RequestBase((message) => {
      logged.push(message);
    });
  });
  afterEach(() => {
    logged.length = 0;
  });

  async function runTests(method: "get" | "post") {
    const reply1 = {};
    const reply2 = { alpha: 1, beta: "2" };
    const reply3 = { m: "NO" };
    const scope = nock(url)
      [method]("/1")
      .reply(200, reply1)
      [method]("/2")
      .reply(200, reply2)
      [method]("/3")
      .reply(403, reply3);

    await requestBase[method](url + "/" + 1);
    await requestBase[method](url + "/" + 2);
    try {
      await requestBase[method](url + "/" + 3);
      assert(false);
    } catch {
      assert(true);
    }
    assert(scope.isDone());
    assert.lengthOf(logged, 6);

    let i = 0;
    assert.equal(logged[i++], method + " " + url + "/1");
    assert.equal(logged[i++], "200 " + JSON.stringify(reply1));
    assert.equal(logged[i++], method + " " + url + "/2");
    assert.equal(logged[i++], "200 " + JSON.stringify(reply2));
    assert.equal(logged[i++], method + " " + url + "/3");
    assert.equal(logged[i++], "403 " + JSON.stringify(reply3));
  }

  for (const method of ["get", "post"] as Array<"get" | "post">) {
    it("for " + method + " requests", async () => {
      await runTests(method);
    });
  }
});
