This folder contains tools for test data generation. This is intented to simplify adding additional element and event data from other users.

The commands below work from the root of this package.

## Initial test data generation

```bash
npm run generate:initial-test-data
```

Loads Basestations, Elements and Events from the Gigaset Elements cloud, tries to remove personal information, removes "duplicate" elements and events, and saves them as json files.

## Extending test data

```bash
npm run generate:merge-test-data
```

Loads Basestations, Elements and Events from the Gigaset Elements cloud, tries to remove personal information, merges with with the currently existing test data, removes "duplicate" elements and events, and saves them as json files.
