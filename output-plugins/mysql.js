'use strict';

const _ = require('underscore');
const changeCase = require('change-case');

const OutputPlugin = require('./output-plugin');

const debug = require('debug')('node-stats-aggregator:mysql');

class MysqlOutputPlugin extends OutputPlugin {
    constructor(options) {
        super(options);
        this.fields = this.keyFields.concat(this.valueFields).concat(this.timeFields);
    }

    dataObjectsToRows(data) {
        const dataToMap = _.chain(data).pairs().sortBy('0').map('1').value();

        return _.map(dataToMap, datum => _.map(this.fields, f => datum[f]));
    }

    insertOnDuplicateUpdate(tableName, primaryKeyFieldNames, dataFieldNames, rows) {
        const results = [];

        function insertOnDuplicateUpdateIteration() {
            if (_.isEmpty(rows))
                return Promise.resolve();

            const allFieldNames = primaryKeyFieldNames.concat(dataFieldNames);

            const currentRowsBatch = rows.splice(0, batchSize);

            const values =
                currentRowsBatch
                    .map(row => `(${_.times(row.length, () => '?').join()})`)
                    .join();

            const valueParameters = _.flatten(currentRowsBatch);

            const updates =
                dataFieldNames
                    .map(function (dataFieldName) {
                        return dataFieldName + '=VALUES(' + dataFieldName + ')';
                    })
                    .join();

            const sql =
                `INSERT INTO ${tableName} (${allFieldNames.join()}) VALUES ${values} ON DUPLICATE KEY UPDATE ${updates}`;

            return this.client
                .queryAsync(sql, valueParameters)
                .spread(function (result) {
                    results.push(result);

                    if (_.isEmpty(rows))
                        return;

                    return insertOnDuplicateUpdateIteration(tableName, primaryKeyFieldNames, dataFieldNames, rows);
                });
        }

        return insertOnDuplicateUpdateIteration(tableName, primaryKeyFieldNames, dataFieldNames, rows)
            .then(function () {
                return results;
            });
    }

    save(data) {
        const updateData = this.dataObjectsToRows(data);
        debug('saving to stat-agg to mysql');
        this.insertOnDuplicateUpdate(
            this.tableName, this.keyFields.concat(this.timeFields), this.valueFields, updateData)
            .catch(err => {
                if (err) {
                    const timeout = 10 * 1000 * Math.random();

                    console.warn(`Failed to save stats, retry in ${timeout}ms`);

                    setTimeout(() => {
                        this.insertOnDuplicateUpdate(
                            this.tableName, this.keyFields.concat(this.timeFields), this.valueFields, updateData)
                            .catch(function (err) {
                                if (err) {
                                    console.error(err.stack || err);
                                }
                            });
                    }, timeout);
                }
            });
    }
}

module.exports = MysqlOutputPlugin;