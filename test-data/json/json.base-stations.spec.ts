/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from "chai";
import { loadBaseStations } from "../data-loader";

loadBaseStations(true).then((basestationRoot) => {
  describe("base-stations.json", () => {
    it("contains an array of baseStations", () => {
      assert.isArray(basestationRoot);
    });

    for (const bs of basestationRoot)
      describe("base-station " + bs.friendly_name, () => {
        it("has equal number of sensors and endnodes", () => {
          assert.equal(bs.endnodes.length, bs.sensors.length);
        });

        it("has matching elements in sensors and endnodes", () => {
          for (const endnode of bs.endnodes) {
            const sensor = bs.sensors.find((s) => s.id === endnode.id)!;
            assert.exists(
              sensor,
              `endnode id ${endnode.id} should be found in sensors`,
            );
            assert.equal(
              endnode.friendly_name,
              sensor.friendly_name,
              "friendly_name should match for id " + endnode.id,
            );
            assert.equal(
              endnode.type,
              sensor.type,
              "type should match for id " + endnode.id,
            );
          }
        });
      });
  });
});
