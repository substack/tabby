var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/render.html', 'utf8');
var cat = require('../cat-list/render.js');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': row.name,
            '.location': row.location,
            '.cats': row.cats.pipe(cat())
        };
    });
};
