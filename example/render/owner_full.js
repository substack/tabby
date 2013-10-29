var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/owner_full.html', 'utf8');
var cat = require('./cat.js');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': row.name,
            '.location': row.location,
            '.cats': row.cats.pipe(cat())
        };
    });
};
