import {
  IBs01Item as IGeneratedBs01Item,
  IElementRoot as IGeneratedElementRoot,
  IStates as IGeneratedStates,
  ISubelementsItem as IGeneratedSubelementsItem,
} from "./gigaset-element";
import { IEndnodesItem } from "./gigaset-base-station";

export * from "./gigaset-base-station";
export * from "./gigaset-element";
export * from "./gigaset-event";

// re-export duplicates manually
export { IRoom, IFrontendTags, IUmosConfiguredType, IO } from "./gigaset-event";

// re-export augmented interfaces
export interface IElementRoot extends IGeneratedElementRoot {
  bs01: IBs01Item[];
}
export interface IBs01Item extends IGeneratedBs01Item {
  subelements: ISubelementsItem[];
}
export interface ISubelementsItem extends IGeneratedSubelementsItem {
  batterySaverMode: unknown;

  states: IStates;
}
export interface IStates extends IGeneratedStates {
  momentaryPowerMeasurement: unknown;
  setPoint: unknown;
}

// export manual interfaces
export interface IGigasetElementsSystemHealth {
  systemHealth: "green" | "orange" | "red";
  statusMsgId: string;
  affectedElements: IEndnodesItem[];
}
