/* eslint-disable no-console */
import "dotenv/config";
import { IBaseStationRoot, IElementRoot, IEventRoot } from "../src";
import { loadBaseStations, loadElements, loadEvents } from ".";
import {
  loadJsonFile,
  saveBaseStations,
  saveElements,
  saveEvents,
} from "./data-loader";
import { mergeTestData } from "./data-tools";
import { printStatsFromJson } from "./generate-tools";
import { resolve } from "path";

const runMe = async () => {
  // load new data
  const {
    bs: newBaseRoot,
    elements: newElementRoot,
    events: newEventRoot,
  } = await loadJsonFile<{
    bs: IBaseStationRoot;
    elements: IElementRoot;
    events: IEventRoot;
  }>(resolve(__dirname, "load-and-merge.json"), true);

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
