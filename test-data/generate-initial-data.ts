/* eslint-disable no-console */
import { createApi, printStatsFromJson } from "./generate-tools";
import { saveBaseStations, saveElements, saveEvents } from "./data-loader";
import { retrieveAndPrepareTestData } from ".";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const runMe = async () => {
  // init
  const api = await createApi();

  // load data
  const [newBaseRoot, newElementRoot, newEventRoot] =
    await retrieveAndPrepareTestData(api);

  // save data
  await saveBaseStations(newBaseRoot);
  await saveElements(newElementRoot);
  await saveEvents(newEventRoot);
  await printStatsFromJson();
};

// TODO: after dropping NodeJS 12, we might be able to use top level await and try/catch
runMe().catch((e) => console.error(e));
