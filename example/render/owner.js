var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/owner.html', 'utf8');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': {
                href: row.link,
                _text: row.name
            },
            '.location': row.location
        };
    });
};
