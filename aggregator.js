'use strict';
const _ = require('underscore');
const cronJob = require('cron').CronJob;

const OutputPlugin = require('./output-plugins/output-plugin');
const MysqlOutputPlugin = require('./output-plugins/mysql');
const StatsDOutputPlugin = require('./output-plugins/statsd');
const debug = require('debug')('node-stats-aggregator');

/**
 * @class
 */
class StatsAggregator {
    constructor(name, keyFields, valueFields) {
        this.name = name;
        this.data = {};
        this.plugins = [];
        this.keyFields = keyFields;
        this.valueFields = valueFields;
        _.each(this.valueFields, (type, vfield) => {
            switch (type) {
                case 'counter':
                default:
                    stat[vfield] = 0;
                    let methodName = changeCase.camel('increment ' + vfield);
                    debug('generating inc method named:', methodName);
                    this[methodName] = () => {
                        const stat = this.getOrCreateStat(keyValues);
                        stat[vfield]++;
                    }
            }
        });
    }

    getOrCreateStat(keyValues) {
        const dataMapKey = keyValues.join('.');
        const dataForKey = this.data[dataMapKey];
        if (dataForKey)
            return dataForKey;
        else {
            this.data[dataMapKey] = {};
            _.each(this.keyFields, kfield => this.data[dataMapKey][kfield] = keyValues[kfield]);
            return this.data[dataMapKey];
        }
    }

    save() {
        if (_.isEmpty(this.data)) {
            return;
        }

        _.each(this.plugins, plugin => plugin.save(this.data));
        this.data = {};
    }
}

module.exports = {
    createStatsAggregator: function (name, keyFields, valueFields, options) {
        var agg = new StatsAggregator(name, keyFields, valueFields);
        new cronJob({
            cronTime: options.cronTime || Math.floor(Math.random() * 60) + ' */3 * * * *',
            onTick: function () {
                console.log('Running ', name, ' stat Job');
                agg.save();
            },
            start: true
        });
        return agg;
    },

    StatsAggregator, OutputPlugin, MysqlOutputPlugin, StatsDOutputPlugin
};