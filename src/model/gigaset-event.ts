/* eslint-disable */
export interface IEventRoot {
  events: IEventsItem[];
  home_state: string;
}
export interface IEventsItem {
  id: string;
  state: string;
  ts: string;
  type: string;
  o?: IO;
  source_id: string;
  source_name?: string;
  source_type: string;
  state_pre: string;
  parents?: string[];
}
export interface IO {
  frontendTags?: IFrontendTags;
  friendly_name?: string;
  id?: string;
  factoryType?: string;
  type?: string;
  umosConfiguredType?: IUmosConfiguredType;
  room?: IRoom;
  basestationFriendlyName?: string;
  configurationLoadedId?: string;
  modeBefore?: string;
  modeAfter?: string;
  userId?: string;
}
export interface IFrontendTags {
  room?: IRoom;
}
export interface IRoom {
  roomName?: string;
  id?: number;
  friendlyName?: string;
}
export interface IUmosConfiguredType {
  mainType: string;
  subType: string;
}
