'use strict';
const _ = require('underscore');
const changeCase = require('change-case');

const OutputPlugin = require('./output-plugin');

const debug = require('debug')('node-stats-aggregator:mysql');

class MysqlOutputPlugin extends OutputPlugin {
    constructor(options) {
        super(options);
        this.fields = this.keyFields.concat(this.valueFields).concat(this.timeFields);
        this.updateStr = (rows) => {
            const valueParamStr = _.map(rows, vector => '(' + vector.join(',') + ')');
            const fieldsInSnakeCase = _.map(this.fields, changeCase.snake);
            const sql = `insert into ${this.tableName} (${fieldsInSnakeCase.join(',')}) 
            values ${valueParamStr} 
            on duplicate key update 
            ${this.valueFields
                .map(changeCase.snake)
                .map(vf => vf + ' = ' + vf + ' + VALUES(' + vf + ')').join(', ')}`;
            debug('update sql:', sql);
            return sql;
        };
    }

    updateData(data) {
        const dataToMap = _.chain(data).pairs().sortBy('0').map('1').value();

        return _.map(dataToMap, datum => _.map(this.fields, f => datum[f]));
    }

    save(data) {
        const updateData = this.updateData(data);
        const sql = this.updateStr(updateData);
        this.client.query(sql, [], err => {
            if (err) {
                console.log(err);
                setTimeout(() => {
                    console.log('Trying to save stats again');
                    this.client.query(sql, [], function (err) {
                        if (err) console.log(err)
                    });
                }, 10 * 1000);
            }
        });
    }
}

module.exports = MysqlOutputPlugin;