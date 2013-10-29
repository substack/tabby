var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/cat_full.html', 'utf8');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': row.name,
            '.owner': {
                href: row.owner.link,
                _text: row.owner.name
            }
        };
    });
};
