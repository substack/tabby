var mapStream = require('map-stream');

module.exports = function (db) {
    return function (params) {
        return db.createReadStream({ start: 'cat-', end: 'cat-~' })
            .pipe(mapStream(write))
        ;
    };
    
    function write (row, cb) {
        db.get(row.value.owner, function (err, owner) {
            if (err) return cb(err);
            row.value.owner = owner.name;
            row.value.location = owner.location;
            cb(null, row.value);
        });
    }
};
