/* eslint-disable */
export interface IElementRoot {
  gp01: any[];
  gp02: any[];
  yc01: any[];
  bs01: IBs01Item[];
}
export interface IBs01Item {
  id: string;
  type: string;
  friendlyName: string;
  firmwareStatus: string;
  firmwareVersion: string;
  latestFirmwareVersion: string;
  connectionStatus: string;
  timezone: string;
  pairingMode: boolean;
  subelements: ISubelementsItem[];
  frontendTags?: IFrontendTags;
  capabilities: string[];
  states: IStates;
  room?: IRoom;
}
export interface ISubelementsItem {
  id: string;
  type: string;
  friendlyName: string;
  firmwareStatus: string;
  firmwareVersion: string;
  latestFirmwareVersion: string;
  connectionStatus: string;
  batteryStatus?: string;
  positionStatus?: string;
  calibrationStatus?: string;
  lastCalReqTimestamp?: number;
  runtimeConfiguration?: IRuntimeConfiguration;
  states?: IStates;
  frontendTags?: IFrontendTags;
  room?: IRoom;
  buttonPressedTs?: number;
  capabilities: any[];
  debug?: IDebug;
}
export interface IRuntimeConfiguration {
  umosConfiguredType: IUmosConfiguredType;
  params: IParams;
}
export interface IUmosConfiguredType {
  mainType: string;
  subType: string;
}
export interface IParams {
  sensibility: number;
  buzzerEnabled: boolean;
  drillDetectorEnabled: boolean;
}
export interface IStates {
  temperature?: number;
  pressure?: number;
  actualParams?: IActualParams;
  factoryType?: string;
  humidity?: number;
  waterAlarm?: string;
  testRequired?: boolean;
  lastAlarmTestTimestamp?: number;
  "dect.remaining_devices_to_be_paired"?: number;
  "dect.remaining_devices_to_be_paired._meta"?: {
    modificationTimestamp: number;
  };
}
export interface IActualParams {
  drillDetectorEnabled: string;
  sensibility: string;
  buzzerEnabled: string;
}
export interface IFrontendTags {
  room: IRoom;
}
export interface IRoom {
  roomName?: string;
  id?: number;
  friendlyName?: string;
}
export interface IDebug {
  simple: string;
  extended: IExtended;
}
export interface IExtended {
  batteryLifetimePredictionColor: string;
}
