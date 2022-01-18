/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IElementRoot, IEventRoot } from "../../src";
import { assert } from "chai";
import { loadElements } from "..";
import { loadEvents } from "../data-loader";

describe("events.json", () => {
  let eventRoot: IEventRoot;
  let elementRoot: IElementRoot;

  before(async () => {
    [eventRoot, elementRoot] = await Promise.all([
      loadEvents(true),
      loadElements(true),
    ]);
  });

  it("contains an events array", () => {
    assert.exists(eventRoot.events);
    assert.isArray(eventRoot.events);
  });

  it("events are sorted in descending order by ts", async () => {
    const { events } = eventRoot;
    assert.isAbove(events.length, 2);
    for (let i = 1; i < events.length; i++)
      assert.isAbove(
        Number.parseInt(events[i - 1].ts, 10),
        Number.parseInt(events[i].ts, 10),
      );
  });

  it("events with source_type 'basestation' match elements from elements.json", () => {
    const events = eventRoot.events.filter(
      (e) => e.source_type === "basestation",
    );
    assert.isAbove(
      events.length,
      0,
      "should have elements with type 'basestation'",
    );

    for (const event of events) {
      assert.exists(event.source_id, "should have source_id");
      assert.exists(event.o, "should have o");
      assert.exists(event.o!.id, "should have o.id");

      const bs01 = elementRoot.bs01.find((b) => b.id === event.source_id)!;
      assert.exists(bs01, "event should have matching basestation");

      const element = bs01.subelements.find(
        (s) => s.id === `${event.source_id}.${event.o!.id}`,
      );
      assert.exists(element, "should have matching element");
    }
  });
});
