import {
  loadBaseStations,
  loadElements,
  loadEvents,
} from "../../test-data/data-loader";
import { json2ts } from "json-ts";
import prettier from "prettier";
import { writeFile } from "fs/promises";

/**
 * generate typescript definitions from test-data json
 */
const generateDefinition = async (
  jsonLoader: () => Promise<unknown>,
  rootName: string,
  fileName: string,
) => {
  // load json
  const json = (await jsonLoader()) as string;
  // extract typescript definitions
  let definitions = json2ts(json, {
    rootName: rootName + "Root",
    namespace: "GigasetElements" + rootName,
  });
  // json2ts added a namespace declaration - remove it
  const start = definitions.indexOf("\n") + 1;
  const end = definitions.lastIndexOf("}\n");
  definitions = definitions.substring(start, end);
  // ignore eslint rules
  definitions = "/* eslint-disable */\n" + definitions;
  // use prettier to format definitions
  const output = await prettier.format(definitions, { parser: "typescript" });
  // write file
  return writeFile(`./src/model/gigaset-${fileName}.ts`, output, {
    encoding: "utf-8",
  });
};

/**
 * generate all typescript definitions from test-data
 */
const generateDefinitions = async () => {
  await generateDefinition(loadBaseStations, "BaseStation", "base-station");
  await generateDefinition(loadElements, "Element", "element");
  await generateDefinition(loadEvents, "Event", "event");
};

// run generation
// TODO: after dropping NodeJS 12, we might be able to use top level await
generateDefinitions();
