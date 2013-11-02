var http = require('http');
var fs = require('fs');
var ecstatic = require('ecstatic')(__dirname + '/static');
var trumpet = require('trumpet');
var duplexer = require('duplexer');

var sub = require('level-sublevel');
var db = sub(require('level')(__dirname + '/test.db', { encoding: 'json' }));

db.batch(require('./data.json'));

var tabby = require('../')(function (route, params) {
    var tr = trumpet();
    var title = route.title;
    if (typeof title === 'function') title = title(params);
    tr.createWriteStream('#section').end(title);
    
    return duplexer(
        tr.createWriteStream('#content'),
        fs.createReadStream(__dirname + '/static/index.html').pipe(tr)
    );
});

tabby.add('/', {
    title: 'home',
    render: function () {
        return fs.createReadStream(__dirname + '/static/home.html');
    }
});

tabby.add('/cats', {
    title: 'cats',
    data: require('./tabs/cat-list/data.js')(db),
    render: require('./tabs/cat-list/render.js')
});

tabby.add('/cats/:name', {
    title: function (params) { return params.name },
    data: require('./tabs/cat/data.js')(db),
    render: require('./tabs/cat/render.js')
});

tabby.add('/owners', {
    title: 'owners',
    data: require('./tabs/owner-list/data.js')(db),
    render: require('./tabs/owner-list/render.js')
});

tabby.add('/owners/:name', {
    title: function (params) { return params.name },
    data: require('./tabs/owner/data.js')(db),
    render: require('./tabs/owner/render.js')
});

var server = http.createServer(function (req, res) {
    if (tabby.test(req)) {
        tabby.handle(req, res);
    }
    else ecstatic(req, res);
});
server.listen(5000);

var sock = require('shoe')(function (stream) {
    stream.pipe(tabby.createStream()).pipe(stream);
});
sock.install(server, '/sock');
