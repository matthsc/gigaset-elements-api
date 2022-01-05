import { assert } from "chai";
import { getSafeTimestampString } from "./utils";

describe("utils.getSafeTimestamp", () => {
  it("converts dates to strings", () => {
    assert.isString(getSafeTimestampString(new Date()));
  });

  it("converts numbers to strings", () => {
    assert.isString(getSafeTimestampString(1));
  });

  it("returns integer strings", () => {
    assert.equal(getSafeTimestampString(1.7), "1");
    assert.equal(getSafeTimestampString(Math.PI), "3");
  });

  it("throws on NaN or Infinity or negative numbers", () => {
    const nany: Array<Date | number> = [
      NaN,
      Infinity,
      new Date(NaN),
      new Date(Infinity),
      new Date("not-a-date"),
      -1,
      Number.MIN_SAFE_INTEGER,
    ];
    for (const test of nany)
      assert.throws(() => {
        getSafeTimestampString(test);
      });
  });
});
