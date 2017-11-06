# node-stats-aggregator
A stats aggregator for NodeJS with a pluggable output system.

## Usage
```js
const StatsAggregator = require('node-stats-aggregator');
const agg = new StatsAggregator('my-aggregator', ['key1', 'key2'], ['val1','val2','val3']);
```

## API
### StatsAggregator
```js
//adding output plugins 
agg.plugins.add(new OutputPlugin());
```
### OutputPlugin
### Output Plugins
#### MySql
```js
const mysqlOutput = new StatsAggregator.MysqlOutputPlugin({
    keyFields: ['key1', 'key2'],
    valueFields: ['val1','val2','val3'],
    client: mysqlClient
});
```
#### StatsD 