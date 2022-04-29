import { IBaseStationRoot, IElementRoot, IEventRoot } from "../src";
import { promises } from "fs";
import { resolve } from "path";
const { readFile, writeFile } = promises; // TODO: NodeJS 12 workaround, otherwise use import { readFile, writeFile } from "fs/promises"

type JsonFileType = "base-stations" | "elements" | "events";

const getFileName = (fileType: JsonFileType) =>
  resolve(__dirname, "json", `${fileType}.json`);

async function loadJsonFileType<T = unknown>(
  fileType: JsonFileType,
  parse?: boolean,
): Promise<string | T> {
  const jsonString = await readFile(getFileName(fileType), "utf-8");
  return parse ? JSON.parse(jsonString) : jsonString;
}

export async function loadJsonFile(fileName: string): Promise<string>;
export async function loadJsonFile(
  fileName: string,
  parse: false,
): Promise<string>;
export async function loadJsonFile<T = unknown>(
  fileName: string,
  parse: true,
): Promise<T>;
export async function loadJsonFile(fileName: string, parse?: boolean) {
  const jsonString = await readFile(fileName, "utf-8");
  return parse ? JSON.parse(jsonString) : jsonString;
}

export function loadBaseStations(): Promise<string>;
export function loadBaseStations(parse: false): Promise<string>;
export function loadBaseStations(parse: true): Promise<IBaseStationRoot>;
export function loadBaseStations(parse?: boolean) {
  return loadJsonFileType<IBaseStationRoot>("base-stations", parse);
}

export function loadElements(): Promise<string>;
export function loadElements(parse: false): Promise<string>;
export function loadElements(parse: true): Promise<IElementRoot>;
export function loadElements(parse?: boolean) {
  return loadJsonFileType<IElementRoot>("elements", parse);
}

export function loadEvents(): Promise<string>;
export function loadEvents(parse: false): Promise<string>;
export function loadEvents(parse: true): Promise<IEventRoot>;
export function loadEvents(parse?: boolean) {
  return loadJsonFileType<IEventRoot>("events", parse);
}

function saveJsonFile(filtype: JsonFileType, data: unknown) {
  if (typeof data !== "string") data = JSON.stringify(data, null, 2);
  return writeFile(getFileName(filtype), data as string, "utf-8");
}

export function saveBaseStations(data: string | IBaseStationRoot) {
  return saveJsonFile("base-stations", data);
}
export function saveElements(data: string | IElementRoot) {
  return saveJsonFile("elements", data);
}
export function saveEvents(data: string | IEventRoot) {
  return saveJsonFile("events", data);
}
