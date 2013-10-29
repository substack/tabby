module.exports = function (db) {
    return function (params, cb) {
        db.get('cat-' + params.name, function (err, cat) {
            if (err) return cb(err);
            db.get(cat.owner, function (err, owner) {
                if (err) return cb(err);
                owner.key = cat.owner;
                cat.owner = owner;
                cb(null, cat);
            });
        });
    };
};
