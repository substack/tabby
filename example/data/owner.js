var through = require('through');
var liveStream = require('level-live-stream');

module.exports = function (db) {
    return function (params) {
        var opts = { min: 'owner-', max: 'owner-~' };
        if (params.live) {
            return liveStream(db, opts).pipe(through(write));
        }
        else {
            return db.createReadStream(opts).pipe(through(write));
        }
        
        function write (row) {
            row.value.link = '/owners/' + row.key.replace(/^owner-/, '');
            this.queue(row.value);
        }
    };
};
