'use strict';
const _ = require('underscore');
const StatsdClient = require('statsd-client');

const OutputPlugin = require('../output-plugin');

class StatsdPlugin extends OutputPlugin {
    constructor(options) {
        super(options);
        this.client = new StatsdClient({host: options.statsdHost});
    }

    save(data) {
        let reportedObjects = this.reportedFields ?
            _.map(data, obj => _.pick(obj, this.reportedFields)) : data;

        _.each(reportedObjects, (value, key) =>
            this.client.increment(this.statKeyNameGenerator(key), value));
    }
}

module.exports = StatsdPlugin;