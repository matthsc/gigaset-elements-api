import { assert } from "chai";
import { loadEvents } from "../data-loader";

describe("events.json", () => {
  it("events are sorted in descending order by ts", async () => {
    const eventRoot = await loadEvents(true);
    assert.isArray(eventRoot.events);
    const { events } = eventRoot;
    assert.isAbove(events.length, 2);
    for (let i = 1; i < events.length; i++)
      assert.isAbove(
        Number.parseInt(events[i - 1].ts, 10),
        Number.parseInt(events[i].ts, 10),
      );
  });
});
