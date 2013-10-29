var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/cat_full.html', 'utf8');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': row.name,
            '.owner': {
                href: '/owners/' + row.owner.key.replace(/^owner-/, ''),
                _text: row.owner.name
            }
        };
    });
};
