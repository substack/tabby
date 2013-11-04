var http = require('http');
var fs = require('fs');
var ecstatic = require('ecstatic')(__dirname + '/static');
var trumpet = require('trumpet');
var duplexer = require('duplexer');

var sub = require('level-sublevel');
var db = sub(require('level')(__dirname + '/test.db', { encoding: 'json' }));
require('level-live-stream').install(db);

db.batch(require('./data.json'));

var tabby = require('../')(function (route, params) {
    var tr = trumpet();
    return duplexer(
        tr.createWriteStream('#content'),
        fs.createReadStream(__dirname + '/static/index.html').pipe(tr)
    );
});

tabby.add('/', {
    render: function () {
        return fs.createReadStream(__dirname + '/static/home.html');
    }
});

tabby.add('/cats', {
    data: require('./tabs/cat-list/data.js')(db),
    render: require('./tabs/cat-list/render.js')
});

tabby.add('/cats/:name', {
    data: require('./tabs/cat/data.js')(db),
    render: require('./tabs/cat/render.js')
});

tabby.add('/owners', {
    data: require('./tabs/owner-list/data.js')(db),
    render: require('./tabs/owner-list/render.js')
});

tabby.add('/owners/:name', {
    data: require('./tabs/owner/data.js')(db),
    render: require('./tabs/owner/render.js')
});

tabby.add('/mews', {
    data: require('./tabs/mews/data.js')(db),
    render: require('./tabs/mews/render.js'),
    live: true
});

var server = http.createServer(function (req, res) {
    if (tabby.test(req)) {
        tabby.handle(req, res);
    }
    else ecstatic(req, res);
});
server.listen(5000);

var sock = require('shoe')(function (stream) {
    stream.pipe().pipe(stream);
});
sock.install(server, '/sock');
