var through = require('through');
var catData = require('./cat.js');

module.exports = function (db) {
    var cats = catData(db);
    
    return function (params, cb) {
        var key = 'owner-' + params.name;
        db.get(key, function (err, owner) {
            if (err) return cb(err);
            
            owner.cats = through(function (cat) {
                if (cat.owner.key === key) this.queue(cat);
            });
            cb(null, owner);
            
            // in a non-trivial example you would use an index here
            cats().pipe(owner.cats);
        });
    };
};
