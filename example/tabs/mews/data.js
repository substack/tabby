var liveStream = require('level-live-stream');
var data = require('../../data.json');

function fakeData (db) {
    function random (re) {
        var xs = data.filter(function (row) {
            return re.test(row.key);
        });
        return xs[Math.floor(Math.random() * xs.length)];
    }
    
    var messages = [
        'feed me!',
        'mrow',
        'meow',
        'purrrr'
    ];
    setInterval(function () {
        var key = 'mews-' + Date.now();
        var cat = random(/^cat-/);
        db.put(key, {
            message: messages[Math.floor(Math.random() * messages.length)],
            cat: {
                link: '/cats/' + cat.key.replace(/^cat-/, ''),
                name: cat.value.name
            }
        });
    }, 3000);
}

module.exports = function (db, opts) {
    fakeData(db);
    
    return function (params) {
        if (params.live) {
            return liveStream(db, params);
        }
        else {
            return db.createReadStream({
                start: 'mews-' + (params.start || ''),
                end: 'mews-' + (params.end || '~'),
                limit: parseInt(params.limit) || 15,
                reverse: true
            });
        }
    };
};
