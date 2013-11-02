var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/render.html', 'utf8');

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
