import {
  IBaseStationRoot,
  IElementRoot,
  IEndnodesItem,
  IEventRoot,
  IEventsItem,
  IRoom,
  ISensorsItem,
  ISettingsItem,
  ISubelementsItem,
} from "../src/model";
import { GigasetElementsApi } from "../src";

export async function retrieveAndPrepareTestData(
  api: GigasetElementsApi,
  from?: Date | number,
): Promise<[IBaseStationRoot, IElementRoot, IEventRoot]> {
  const baseStations = await api.getBaseStations();
  const elements = await api.getElements();

  if (!from) from = Date.now() - 31 * 24 * 60 * 60 * 1000;
  let to: number = Date.now();
  let allEvents: IEventsItem[] = [];
  let result: IEventRoot;
  const batchSize = 500;
  do {
    result = await api.getEvents(from, to, batchSize);
    const newEvents = result.events;
    if (newEvents.length) {
      allEvents = allEvents.concat(
        quicklyFilterDuplicateEventsByTypeAndElement(newEvents),
      );
      to = Number.parseInt(newEvents[newEvents.length - 1].ts, 10) - 1;
    }
  } while (result.events?.length === batchSize);
  allEvents = quicklyFilterDuplicateEventsByTypeAndElement(allEvents);

  const elementRoot: IEventRoot = { ...result, events: allEvents };
  reduceTestData(baseStations, elements, elementRoot);
  tryStripPersonalDataAndGiveUniqueIds(baseStations, elements, elementRoot);

  return [baseStations, elements, elementRoot];
}

function quicklyFilterDuplicateEventsByTypeAndElement(
  events: IEventsItem[],
): IEventsItem[] {
  const set = new Set<string>();
  return events.filter((e) => {
    const key = e.type + "-" + JSON.stringify(e.o);
    if (set.has(key)) return false;
    set.add(key);
    return true;
  });
}

interface IPersonalDataMaps {
  baseIds: Map<string, string>;
  baseNames: Map<string, string>;
  elementIds: Map<string, string>;
  elementNames: Map<string, string>;
  roomNames: Map<string, string>;
  getOrCreateId: (
    map: Map<string, string>,
    prefix: string,
    id: string,
  ) => string;
}

export function tryStripPersonalDataAndGiveUniqueIds(
  baseStations: IBaseStationRoot,
  elementRoot: IElementRoot,
  eventRoot: IEventRoot,
): void {
  // init
  const maps: IPersonalDataMaps = {
    baseIds: new Map<string, string>(),
    baseNames: new Map<string, string>(),
    elementIds: new Map<string, string>(),
    elementNames: new Map<string, string>(),
    roomNames: new Map<string, string>(),
    getOrCreateId: (
      map: Map<string, string>,
      prefix: string,
      id: string,
    ): string => {
      // return previously created id
      if (map.has(id)) return map.get(id) as string;

      // generate pseudo-random postfix
      const chars =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEVFGHIKLMNOPQRSTUVWXYZ";
      let postfix = "";
      for (let i = 0; i < 5; i++)
        postfix += chars[Math.floor(Math.random() * chars.length)];

      // create id, add to map, and return it
      const value = `${prefix}${map.size
        .toString()
        .padStart(3, "0")}-${postfix}`;
      map.set(id, value);
      return value;
    },
  };

  tryStripPersonalDataFromBaseStation(baseStations, maps);
  tryStripPersonalDataFromElement(elementRoot, maps);
  tryStripPersonalDataFromEvents(eventRoot.events, maps);
}

function tryStripPersonalDataFromBaseStation(
  baseStations: IBaseStationRoot,
  maps: IPersonalDataMaps,
) {
  for (const base of baseStations) {
    // update base station
    const { id } = base;
    base.id = maps.getOrCreateId(maps.baseIds, "baseId", id);
    base.friendly_name = maps.getOrCreateId(maps.baseNames, "baseName", id);

    // update elements in endnodes and sensors
    tryStripPersonalDataFromBaseStationElement(base.endnodes, maps);
    tryStripPersonalDataFromBaseStationElement(base.sensors, maps);

    // update endnode_ids in .intrusion_settings
    for (const mode of base.intrusion_settings?.modes ?? []) {
      const keys = Object.keys(mode);
      for (const key of keys) {
        const settings = (
          mode[key as keyof typeof mode] as { settings?: ISettingsItem[] }
        ).settings;
        if (settings) {
          for (const setting of settings) {
            if (setting.endnode_id)
              setting.endnode_id = maps.elementIds.get(
                setting.endnode_id,
              ) as string;
          }
        }
      }
    }
  }
}

function tryStripPersonalDataFromBaseStationElement(
  elements: IEndnodesItem[] | ISensorsItem[],
  maps: IPersonalDataMaps,
) {
  for (const element of elements) {
    const { id } = element;
    element.id = maps.getOrCreateId(maps.elementIds, "elementId", id);
    element.friendly_name = maps.getOrCreateId(
      maps.elementNames,
      "elementName",
      id,
    );
  }
}

function tryStripPersonalDataFromElement(
  elementRoot: IElementRoot,
  maps: IPersonalDataMaps,
) {
  for (const bs01 of elementRoot.bs01) {
    const { id: baseId } = bs01;
    bs01.id = maps.baseIds.get(baseId) as string;
    bs01.friendlyName = maps.baseNames.get(baseId) as string;
    tryStripPersonalDataFromRooms(bs01, maps);

    for (const subelement of bs01.subelements) {
      const [baseId, elementId] = subelement.id.split(".");
      subelement.id = `${maps.baseIds.get(baseId)}.${maps.elementIds.get(
        elementId,
      )}`;
      subelement.friendlyName =
        maps.elementNames.get(elementId) ?? subelement.friendlyName;

      tryStripPersonalDataFromRooms(subelement, maps);
    }
  }
}

function tryStripPersonalDataFromEvents(
  events: IEventsItem[],
  maps: IPersonalDataMaps,
) {
  for (const event of events) {
    const { source_id: baseId, o } = event;
    event.source_id = maps.baseIds.get(baseId) ?? event.source_id;
    event.source_name = maps.baseNames.get(baseId) ?? event.source_name;

    if (!o) continue;
    if (o.id) {
      const elementId = o.id;
      o.id = maps.elementIds.get(elementId) ?? o.id;
      o.friendly_name = maps.elementNames.get(elementId) ?? o.friendly_name;
      tryStripPersonalDataFromRooms(o, maps);
    }
    if (o.userId) {
      o.userId = o.userId.substring(0, o.userId.lastIndexOf("/")) + "/xxx";
    }
    if (o.configurationLoadedId) {
      o.configurationLoadedId = "0123";
    }
    if (o.basestationFriendlyName) {
      o.basestationFriendlyName = "basestation name";
    }
  }
}

function tryStripPersonalDataFromRooms(
  objectWithRoomData: unknown,
  maps: IPersonalDataMaps,
) {
  const item = objectWithRoomData as ISubelementsItem;
  const rooms: IRoom[] = [];
  if (item.room) {
    rooms.push(item.room);
  }
  if (item.frontendTags?.room) {
    rooms.push(item.frontendTags.room);
  }
  for (const room of rooms) {
    const roomName = room.roomName || room.friendlyName;
    if (!roomName) continue;

    const getRoomName = () =>
      maps.getOrCreateId(maps.roomNames, "Room ", roomName);
    if (room.roomName) room.roomName = getRoomName();
    if (room.friendlyName) room.friendlyName = getRoomName();
  }
}

export function reduceTestData(
  baseStations: IBaseStationRoot,
  elementRoot: IElementRoot,
  eventRoot: IEventRoot,
) {
  // init
  const elementIdRemapping = new Map<string, ISubelementsItem>();
  const getElementKey = (item: ISubelementsItem): string =>
    `${item.type}-${item.states?.factoryType}-${item.batteryStatus}-${item.calibrationStatus}-${item.connectionStatus}`;
  const getEventKey = (item: IEventsItem): string =>
    `${item.type}-${item.o?.type}-${item.o?.factoryType}`;
  const getElementIdFromEvent = (item: IEventsItem): string =>
    `${item.source_id}.${item.o?.id}`;

  // determine unique elements per base station
  for (const bs01 of elementRoot.bs01) {
    const uniqueElementTypeMap = new Map<string, ISubelementsItem>();
    for (const subelement of bs01.subelements) {
      const key = getElementKey(subelement);
      if (uniqueElementTypeMap.has(key)) {
        elementIdRemapping.set(
          subelement.id,
          uniqueElementTypeMap.get(key) as ISubelementsItem,
        );
      } else {
        uniqueElementTypeMap.set(key, subelement);
      }
    }
  }

  // filter elements
  for (const base of baseStations) {
    base.endnodes = base.endnodes.filter(
      (e) => !elementIdRemapping.has(`${base.id}.${e.id}`),
    );
    base.sensors = base.sensors.filter(
      (s) => !elementIdRemapping.has(`${base.id}.${s.id}`),
    );
  }
  for (const bs01 of elementRoot.bs01) {
    bs01.subelements = bs01.subelements.filter(
      (s) => !elementIdRemapping.has(s.id),
    );
  }

  // remap and filter events
  const uniqueEventTypes = new Set<string>();
  eventRoot.events = eventRoot.events
    .reverse() // oldest first
    .filter((e) => {
      const key = getEventKey(e);
      if (uniqueEventTypes.has(key)) return false;
      uniqueEventTypes.add(key);
      return true;
    })
    .map((e) => {
      const mapped = { ...e };
      if (e.o) {
        const o = (mapped.o = { ...e.o });

        if (o.id) {
          const elementId = getElementIdFromEvent(e);
          if (elementIdRemapping.has(elementId)) {
            const mappedElement = elementIdRemapping.get(
              elementId,
            ) as ISubelementsItem;
            o.id = mappedElement.id.split(".")[1];
            o.friendly_name = mappedElement.friendlyName;
          }
        }
      }
      return mapped;
    })
    .reverse(); // newest first again
}

export function mergeTestData(
  baseStationRoots: IBaseStationRoot[],
  elementRoots: IElementRoot[],
  eventRoots: IEventRoot[],
): [IBaseStationRoot, IElementRoot, IEventRoot] {
  // sort base stations, assuming tryStripPersonalDataAndGiveUniqueIds has run before
  baseStationRoots.forEach((r) => {
    r.sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));
  });
  elementRoots.forEach((r) => {
    r.bs01.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
  });

  // merge base stations, including elements
  const mergedBaseStationRoot = baseStationRoots[0];
  for (let i = 1; i < baseStationRoots.length; i++) {
    const currentBaseStationRoot = baseStationRoots[i];
    for (let j = 0; j < baseStationRoots[i].length; j++) {
      const currentBaseStation = currentBaseStationRoot[j];
      if (j >= mergedBaseStationRoot.length) {
        mergedBaseStationRoot.push(currentBaseStation);
      } else {
        mergedBaseStationRoot[j].endnodes.push(...currentBaseStation.endnodes);
        mergedBaseStationRoot[j].sensors.push(...currentBaseStation.sensors);
      }
    }
  }

  // merge elements, fix ids
  const mergedElementsRoot = elementRoots[0];
  for (let i = 1; i < elementRoots.length; i++) {
    const currentElementRoot = elementRoots[i];
    for (let j = 0; j < currentElementRoot.bs01.length; j++) {
      const currentBs01 = currentElementRoot.bs01[j];
      if (j >= mergedElementsRoot.bs01.length) {
        mergedElementsRoot.bs01.push(currentBs01);
      } else {
        mergedElementsRoot.bs01[j].subelements.push(
          ...currentBs01.subelements.map((e) => ({
            ...e,
            id: mergedElementsRoot.bs01[j].id + "." + e.id.split(".")[1],
          })),
        );
      }
    }
  }

  // merge events, fix ids
  const mergedEventRoot = eventRoots[0];
  for (let i = 1; i < eventRoots.length; i++) {
    mergedEventRoot.events.push(
      ...eventRoots[i].events.map((e) => ({
        ...e,
        source_id: (
          baseStationRoots[i].find((r) => r.id === e.source_id) ?? {
            id: e.source_id,
          }
        ).id,
        source_name: (
          baseStationRoots[i].find((r) => r.id === e.source_id) ?? {
            friendly_name: e.source_name,
          }
        ).friendly_name,
      })),
    );
  }
  // sort events
  mergedEventRoot.events.sort((a, b) => b.ts.localeCompare(a.ts));

  // reduce data, and run tryStripPersonalDataAndGiveUniqueIds again
  reduceTestData(mergedBaseStationRoot, mergedElementsRoot, mergedEventRoot);
  tryStripPersonalDataAndGiveUniqueIds(
    mergedBaseStationRoot,
    mergedElementsRoot,
    mergedEventRoot,
  );
  return [mergedBaseStationRoot, mergedElementsRoot, mergedEventRoot];
}
