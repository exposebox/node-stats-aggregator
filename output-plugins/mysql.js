'use strict';
const OutputPlugin = require('output-plugin');

class MysqlOutputPlugin extends OutputPlugin {
    constructor(options) {
        super(options);
        this.updateStr = (valueCount, valueSize) => {
            const valueParamStr = _.times(valueCount, () => '(' + _.times(valueSize, () => '?') + ')');
            `insert into ${this.tableName} (${this.keyFields.concat(this.valueFields).join(',')}) 
            values ${valueParamStr} 
            on duplicate key update 
            ${this.valueFields.map(vf => vf + ' = ' + vf + ' VALUES(' + vf + ')').join(', ')}`
        };
    }

    save(data) {
        const updateData = _.map(data, obj => this.updateDataGenerator(obj));
        this.client.query(this.updateStr, updateData, function (err) {
            if (err) {
                console.log(err);
                setTimeout(() => {
                    console.log('Trying to save stats again');
                    this.client.query(updateStr, updateData, function (err) {
                        if (err) console.log(err)
                    });
                }, 10 * 1000);
            }
        });
    }
}