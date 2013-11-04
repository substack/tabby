var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/render.html', 'utf8');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.message': row.value.message,
            '.cat': {
                _text: row.value.cat.name,
                href: row.value.cat.link
            }
        };
    });
};
