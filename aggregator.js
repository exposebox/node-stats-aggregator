'use strict';
const _ = require('underscore');
const cronJob = require('cron').CronJob;
const changeCase = require('change-case');

const OutputPlugin = require('./output-plugins/output-plugin');
const MysqlOutputPlugin = require('./output-plugins/mysql');
const StatsDOutputPlugin = require('./output-plugins/statsd');
const debug = require('debug')('node-stats-aggregator:aggregator');

/**
 * @class
 */
class StatsAggregator {
    constructor(name, keyFields, valueFields, options) {
        this.name = name;
        this.data = {};
        this.plugins = [];
        this.keyFields = keyFields;
        debug('keyFields = ', keyFields);
        this.valueFields = valueFields;
        debug('valueFields = ', valueFields);
        this.valueFieldsAliases = (options && options.valueFieldsAliases) || {};
        debug('aliases map:', this.valueFieldsAliases);
        this.timeFields = (options && options.timeFields) || {};
        debug('timeFields:', this.timeFields);
        _.each(this.valueFields, vfield => {
            let methodName = changeCase.camel('add ' + (this.valueFieldsAliases[vfield] || vfield));
            debug(this.name, ' is generating inc method named:', methodName);
            this[methodName] = (keyValues) => {
                const stat = this.getOrCreateStat(keyValues);
                stat[vfield]++;
            }
        });
    }

    getOrCreateStat(keyValues) {
        const dataMapKey = _.map(this.keyFields, kf => keyValues[kf]).join('.');
        const dataForKey = this.data[dataMapKey];
        if (dataForKey)
            return dataForKey;
        else {
            this.data[dataMapKey] = {};
            _.each(this.keyFields, kfield => this.data[dataMapKey][kfield] = keyValues[kfield]);
            _.each(this.valueFields, vfield => this.data[dataMapKey][vfield] = 0);
            _.each(this.timeFields, (timeFunc, tfieldName) => this.data[dataMapKey][tfieldName] = timeFunc());
            const stat = this.data[dataMapKey];
            debug('createdStat:', stat);
            return stat;
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
        var agg = new StatsAggregator(name, keyFields, valueFields, options);
        new cronJob({
            cronTime: (options && options.cronTime) || Math.floor(Math.random() * 60) + ' */3 * * * *',
            onTick: function () {
                debug(`Running ${name} stat Job`);
                agg.save();
            },
            start: true
        });
        return agg;
    },

    StatsAggregator, OutputPlugin, MysqlOutputPlugin, StatsDOutputPlugin
};