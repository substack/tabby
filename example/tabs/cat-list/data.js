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
            row.value.owner = {
                key: row.value.owner,
                link: '/owners/' + row.value.owner.replace(/^owner-/, ''),
                name: owner.name
            };
            row.value.location = owner.location;
            row.value.link = '/cats/' + row.key.replace(/^cat-/, '');
            cb(null, row.value);
        });
    }
};
