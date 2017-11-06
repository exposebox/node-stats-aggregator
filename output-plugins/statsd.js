'use strict';
const _ = require('underscore');
const StatsdClient = require('statsd-client');

const OutputPlugin = require('../output-plugin');

const debug = require('node-stats-generator')('node-stats-aggregator:statsd');

class StatsdPlugin extends OutputPlugin {
    constructor(options) {
        super(options);
        this.client = new StatsdClient({host: options.statsdHost});
    }

    save(data) {
        const reportedFields = this.reportedFields || _.keys;
        _.chain(data).values().each(datum => {
            _.each(reportedFields, f => {
                const statsdKey = this.statNameGenerator(f, datum);
                this.client.increment(statsdKey, datum[f])
            });
        });
    }
}

module.exports = StatsdPlugin;