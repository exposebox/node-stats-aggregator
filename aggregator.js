'use strict';
const _ = require('underscore');
const cronJob = require('cron').CronJob;

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
                    this[changeCase.camel('increment ' + vfield)] = () => {
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
        _.each(this.plugins, plugin => plugin.save(this.data));
        this.data = {};
    }
}

module.exports = function createStatsAggregator(name, keyFields, valueFields) {
    var agg = new StatsAggregator(name, keyFields, valueFields);
    var sec = Math.floor(Math.random() * 60);
    new cronJob({
        cronTime: sec + ' */3 * * * *',
        onTick: function () {
            console.log('Running ', name, ' stat Job');
            agg.save();
        },
        start: true
    });
    return agg;
};