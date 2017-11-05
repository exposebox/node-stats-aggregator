'use strict';
const _ = require('underscore');
const changeCase = require('change-case');

class OutputPlugin {
    constructor(options) {
        _.extend(this, options);
    }

    save(data) {
        throw new Error('UNIMPLEMENTED');
    }
}

module.exports = OutputPlugin;