/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { loadBaseStations, loadElements } from "..";
import { IBaseStationRootItem } from "../../src";
import { assert } from "chai";

Promise.all([loadBaseStations(true), loadElements(true)]).then(
  ([basestationRoot, elementRoot]) => {
    describe("elements.json", () => {
      it("contains a bs01 array", () => {
        assert.exists(elementRoot.bs01);
        assert.isArray(elementRoot.bs01);
      });

      it("has same number of basestations as base-stations.xml", () => {
        assert.equal(elementRoot.bs01.length, basestationRoot.length);
      });

      for (const bs01 of elementRoot.bs01) {
        describe("base-station " + bs01.friendlyName, () => {
          let basestation: IBaseStationRootItem;
          before(() => {
            basestation = basestationRoot.find((bs) => bs.id === bs01.id)!;
          });

          it("has matching basestation in base-stations.xml", () => {
            assert.exists(basestation);
            assert.equal(
              bs01.friendlyName,
              basestation.friendly_name,
              `friendlyName ${bs01.friendlyName} should match`,
            );
          });

          it("has same number of elements as in base-stations.xml", () => {
            assert.equal(bs01.subelements.length, basestation.endnodes.length);
          });

          it("has same ids as elements in base-stations.xml", () => {
            for (const element of bs01.subelements) {
              const [baseId, elementId] = element.id.split(".");
              assert.equal(baseId, bs01.id, "BasestationId should match");
              assert.exists(
                basestation.endnodes.find((e) => e.id === elementId),
              );
            }
          });
        });
      }
    });
  },
);
