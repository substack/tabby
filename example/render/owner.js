var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/owner.html', 'utf8');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': {
                href: '/owners/' + row.key.replace(/^owner-/, ''),
                _text: row.value.name
            },
            '.location': row.value.location
        };
    });
};
