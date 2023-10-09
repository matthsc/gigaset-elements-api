/* eslint-disable */
export interface IElementRoot {
  gp01: any[];
  gp02: IGp02Item[];
  yc01: any[];
  bs01: IBs01Item[];
  bs02: any[];
}
export interface IGp02Item {
  id: string;
  friendlyName: string;
  frontendTags: IFrontendTags;
  connectionStatus: string;
  room: IRoom;
  capabilities: string[];
  subelements: any[];
}
export interface IFrontendTags {
  room: IRoom;
}
export interface IRoom {
  roomName?: string;
  id?: number;
  friendlyName?: string;
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
  capabilities: string[];
  states: IStates;
  frontendTags?: IFrontendTags;
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
  capabilities: any[];
  batteryStatus?: string;
  positionStatus?: string;
  calibrationStatus?: string;
  lastCalReqTimestamp?: number;
  runtimeConfiguration?: IRuntimeConfiguration;
  states?: IStates;
  frontendTags?: IFrontendTags;
  room?: IRoom;
  buttonPressedTs?: number;
  debug?: IDebug;
  testRequired?: boolean;
  unmounted?: boolean;
  smokeDetected?: boolean;
  permanentBatteryLow?: boolean;
  permanentBatteryChangeRequest?: boolean;
  smokeChamberFail?: boolean;
  smokeDetectorOff?: boolean;
  lastAlarmTestTimestamp?: number;
  lastPairingTimestamp?: number;
}
export interface IRuntimeConfiguration {
  umosConfiguredType: IUmosConfiguredType;
  params: IParams;
  relayState?: string;
  startTimestampInSeconds?: number;
  durationInSeconds?: number;
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
  relay?: string;
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
export interface IDebug {
  simple: string;
  extended: IExtended;
}
export interface IExtended {
  batteryLifetimePredictionColor: string;
}
