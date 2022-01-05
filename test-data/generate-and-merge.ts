/* eslint-disable no-console */
import { createApi, printStatsFromJson } from "./generate-tools";
import {
  loadBaseStations,
  loadElements,
  loadEvents,
  retrieveAndPrepareTestData,
} from ".";
import { saveBaseStations, saveElements, saveEvents } from "./data-loader";
import { mergeTestData } from "./data-tools";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const runMe = async () => {
  // init
  const api = await createApi();

  // load new data
  const [newBaseRoot, newElementRoot, newEventRoot] =
    await retrieveAndPrepareTestData(api);

  // load existing data
  const [oldBaseRoot, oldElementRoot, oldEventRoot] = await Promise.all([
    loadBaseStations(true),
    loadElements(true),
    loadEvents(true),
  ]);
  await printStatsFromJson("before");

  // merge data
  const [mergedBaseRoots, mergedElementRoots, mergedEventRoots] = mergeTestData(
    [oldBaseRoot, newBaseRoot],
    [oldElementRoot, newElementRoot],
    [oldEventRoot, newEventRoot],
  );

  // save data
  await saveBaseStations(mergedBaseRoots);
  await saveElements(mergedElementRoots);
  await saveEvents(mergedEventRoots);
  await printStatsFromJson("after");
};

// TODO: after dropping NodeJS 12, we might be able to use top level await and try/catch
runMe().catch((e) => console.error(e));
