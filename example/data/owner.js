var through = require('through');

module.exports = function (db) {
    return function (params) {
        return db.createReadStream({ start: 'owner-', end: 'owner-~' })
            .pipe(through(write))
        ;
        function write (row) {
            row.value.link = '/owners/' + row.key.replace(/^owner-/, '');
            this.queue(row.value);
        }
    };
};
