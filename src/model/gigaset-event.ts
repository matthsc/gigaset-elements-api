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
  consumed?: string;
  reason?: string;
  frontendTags?: IFrontendTags;
  friendly_name?: string;
  delay?: string;
  id?: string;
  type?: string;
  room?: IRoom;
  factoryType?: string;
  umosConfiguredType?: IUmosConfiguredType;
  dialable?: boolean;
  line_type?: string;
  line_index?: number;
  call_type?: string;
  clip_type?: string;
  clip?: string;
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
