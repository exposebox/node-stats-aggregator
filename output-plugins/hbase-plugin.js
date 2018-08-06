'use strict';

const OutputPlugin = require('./output-plugin');

class HBasePlugin extends OutputPlugin {
    constructor(table,columnFamily, keyFields, valueFields, hbaseClient) {
        super({table,columnFamily, keyFields, valueFields, hbaseClient});
    }

    createRowKey(key,dataRow){
        return [key,dataRow].join('.');
    }

    addCellInc(inc,cellKey,cellValue){
        inc.add(this.columnFamily,cellKey,cellValue);
    }

    save(data) {
        for (let key in data) {
            const dataRow = data[key];
            const rowKey = this.createRowKey(key,dataRow);
            const inc = new this.hbaseClient.Inc(rowKey);

            for(let valueKey of this.valueFields){
                this.addCellInc(inc,valueKey,dataRow[valueKey]);
            }

            this.hbaseClient.inc(this.table, inc, function(){});
        }
    }
};

module.exports = HBasePlugin;