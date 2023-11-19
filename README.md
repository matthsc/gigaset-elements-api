# gigaset-elements-api

Library to access Gigaset Elements API.

![node](https://img.shields.io/node/v-lts/gigaset-elements-api)
[![npm](https://img.shields.io/npm/v/gigaset-elements-api)](https://www.npmjs.com/package/gigaset-elements-api)
[![license](https://img.shields.io/npm/l/gigaset-elements-api)](LICENSE)

![build](https://img.shields.io/github/actions/workflow/status/matthsc/gigaset-elements-api/build-and-test.yml?branch=main)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/matthsc/gigaset-elements-api)
![Code Climate issues](https://img.shields.io/codeclimate/issues/matthsc/gigaset-elements-api)
![Code Climate technical debt](https://img.shields.io/codeclimate/tech-debt/matthsc/gigaset-elements-api)
](https://codeclimate.com/github/matthsc/gigaset-elements-api)

# Installation

```bash
npm install gigaset-elements-api

// or

yarn add gigaset-elements-api
```

# Usage

## Getting started

```ts
import { GigasetElementsApi } from "gigaset-elements-api";

const api = new GigasetElementsApi({
  email: "username/email for accessing GE cloud",
  password: "password of accessing GE cloud",
});
```

The constructor of the <code>GigasetElementsApi</code> class acccepts the following configuration object:

```ts
{
  // required
  email: "<email>", // username/email for accessing GE cloud
  password: "<password>", // password of accessing GE cloud
  // optional
  authorizeHours: 6, // defaults to 6, number of hours after which GE cloud needs reauthorization
  requestLogger: (message: string) => void, // for logging all http requests
}
```

## Methods

### isMaintenance

Check whether GE cloud is in maintenance mode and currently not available

```ts
api.isMaintenance(): Promise<boolean>
```

### getSystemHealth

Retrive system health data.

```ts
api.getSystemHealth(): Promise<IGigasetElementsSystemHealth>
```

### getBaseStations

Retrieves base station and sensor data. Automatically handles authorization if required.

```ts
api.getBaseStations(): Promise<IBaseStationRoot>;
```

### getElements

Retrieves elements, including sensor data (i.e. temperature for universal sensor). Automatically handles authorization if required.

```ts
api.getElements(): Promise<IElementRoot>;
```

### getRecentEvents

Retrieves the most recent events that occured until a given point in time. Events are sorted by timestamp in descending order. Only the most recent <code>limit</code> number of events will be returned.

```ts
api.getRecentEvents(until: Date | number, limit = 500): Promise<IEventRoot>;
```

### getEvents

Retrieves events that occured during a time period. Events are sorted by timestamp in descending order. Limit is applied from the end of the period.

```ts
api.getEvents(from: Date | number, to: Date | number, limit = 500): Promise<IEventRoot>
```

### getAllEvents

Utility method to retrieves all events that occured during a time period, using multiple requests if more than <code>batchSize</code> events occured in this period. Events are sorted by timestamp in descending order. If <code>to</code> is not specified, the current date will be used.

```ts
api.getAllEvents(from: Date | number, to?: Date | number, batchSize = 500): Promise<IEventsItem[]>
```

### sendCommand

Sends a command for an endNode, i.e. "on" or "off" for plugs. Throws if the command is invalid (HTTP 400), i.e. when sending "off" to a plug that is already turned off.

```ts
api.sendCommand(baseStationId: string, endNodeId: string, commandName: string): Promise<void>;
```

### setUserAlarm

Turn user alarm (panic button) on or off,

```ts
api.setUserAlarm(on: boolean): Promise<void>;
```

### setAlarmMode

Updates the active alarm mode.

```ts
setAlarmMode(baseStationId: string, mode: "away" | "home" | "night" | "custom"): Promise<void>
```

### authorize

Authorize against the GE cloud. Retrieves and stores authorization cookie for further api requests. Usually this is done automatically by methods that need authorization like <code>getRecentEvents</code> and doesn't neet to be called manually.

```ts
api.authorize(): Promise<true>;
```

### needsAuth

Check whether authorization is due, i.e. last authorization was more than <code>authorizeHours</code> ago. Usually this is only used internally.

```ts
api.needsAuth(): boolean;
```

# Limitations

- The library was designed to fit my needs for an [ioBroker adapter](https://github.com/matthsc/ioBroker.gigaset-elements). If additional functionality is required please open an issue.

- Event data in the Gigaset Elements cloud reaches back 1 month, and a maximum of 500 events can be retrieved per api call as per my tests.

So far the library has been tested with the following sensors, which have also test data available:

| Sensor | Description                                                  |
| ------ | ------------------------------------------------------------ |
| is01   | Siren                                                        |
| um01   | Universal/Window/Door                                        |
| wd01   | Water                                                        |
| sd01   | Smoke (only test alarms)                                     |
| sp01   | Plug v1 (sponsored by [Voggl93](https://github.com/Voggl93)) |

In addition definitions and test data for IP Phones (gp02) has been included.

# Contributing

## Running tests

```bash
npm test

// or with watch mode
npm run test:watch
```

## Adding test data for additional element or event types

```bash
npm run generate:merge-test-data
```

See also [Test Data](test-data/README.md)

# Acknowledgements

This library would not be possible without the awsome work of https://github.com/ycardon/gigaset-elements-proxy and https://github.com/dynasticorpheus/gigasetelements-ha.

Hardware sponsors:

- [Voggl93](https://github.com/Voggl93) (Plug v1)
