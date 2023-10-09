/* eslint-disable */
export type IBaseStationRoot = IBaseStationRootItem[];
export interface IBaseStationRootItem {
  id: string;
  friendly_name: string;
  status: string;
  firmware_status: string;
  updates_available: boolean;
  version: string;
  latest_version: string;
  fw_outdated: boolean;
  intrusion_settings: IIntrusion_settings;
  timezone?: string;
  endnodes: IEndnodesItem[];
  sensors: ISensorsItem[];
}
export interface IIntrusion_settings {
  active_mode: string;
  requestedMode: string;
  modeTransitionInProgress: boolean;
  modes: IModesItem[];
}
export interface IModesItem {
  custom?: ICustom;
  night?: INight;
  home?: IHome;
  away?: IAway;
}
export interface ICustom {
  sirens_on: boolean;
  trigger_delay: number;
  privacy_mode: boolean;
  settings: ISettingsItem[];
}
export interface ISettingsItem {
  behaviors: IBehaviors;
  endnode_id?: string;
}
export interface IBehaviors {
  open: string;
  prealert: string;
  tilt: string;
  drilling: string;
  forcedentry: string;
}
export interface INight {
  sirens_on: boolean;
  trigger_delay: number;
  privacy_mode: boolean;
  settings: ISettingsItem[];
}
export interface IHome {
  sirens_on: boolean;
  trigger_delay: number;
  privacy_mode: boolean;
}
export interface IAway {
  sirens_on: boolean;
  trigger_delay: number;
  privacy_mode: boolean;
}
export interface IEndnodesItem {
  id: string;
  type: string;
  friendly_name: string;
  status: string;
  firmware_status: string;
  fw_version: string;
  latest_version: string;
  battery?: IBattery;
  ts_button?: number;
  position_status?: string;
  o?: IO;
}
export interface IBattery {
  state: string;
}
export interface IO {
  relay: string;
  configuration: IConfiguration;
}
export interface IConfiguration {
  relayState: string;
  startTimestampInSeconds: number;
  durationInSeconds: number;
}
export interface ISensorsItem {
  id: string;
  type: string;
  friendly_name: string;
  status: string;
  firmware_status: string;
  fw_version: string;
  latest_version: string;
  battery?: IBattery;
  ts_button?: number;
  position_status?: string;
  o?: IO;
}
