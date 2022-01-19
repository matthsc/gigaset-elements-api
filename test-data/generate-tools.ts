/* eslint-disable no-console */
import "dotenv/config";
import { loadBaseStations, loadElements, loadEvents } from ".";
import { GigasetElementsApi } from "../src";

/** helper method for creating the API instance */
export async function createApi() {
  // init
  const email = process.env.GE_EMAIL as string;
  const password = process.env.GE_PASS as string;

  if (!email || !password) {
    throw new Error("Please specify email and password in .env file");
  }

  // prepare GE connection
  const api = new GigasetElementsApi({
    email: process.env.GE_EMAIL as string,
    password: process.env.GE_PASS as string,
  });
  await api.authorize();
  return api;
}

/** prints some stats from json files for quick visual verification */
export async function printStatsFromJson(title?: string) {
  const separator = "============================================";
  console.log(separator);
  console.log("= Stats from JSON files" + (title ? " - " + title : ""));
  console.log(separator);

  const [bases, elements, events] = await Promise.all([
    loadBaseStations(true),
    loadElements(true),
    loadEvents(true),
  ]);
  console.log(
    "Basestations: %o (basestations) - %o (elements)",
    bases.length,
    elements.bs01.length,
  );
  for (let i = 0; i < bases.length; i++)
    console.log(
      "Elements Base %o: %o (endnotes) - %o (sensors) - %o (elements)",
      i,
      bases[i].endnodes.length,
      bases[i].sensors.length,
      elements.bs01[i].subelements.length,
    );
  console.log("Events: %o", events.events.length);
  console.log(separator);
}
