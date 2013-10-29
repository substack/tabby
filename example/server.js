var http = require('http');
var fs = require('fs');
var trumpet = require('trumpet');
var ecstatic = require('ecstatic')(__dirname + '/static');

var sub = require('level-sublevel');
var db = sub(require('level')(__dirname + '/test.db'));
var assoc = require('level-assoc')(db);

var types = {
    pets: assoc.add('pets')
        .hasMany('cats', [ 'type', 'cat' ])
        .hasMany('dogs', [ 'type', 'dog' ])
        .hasMany('parrots', [ 'type', 'parrot' ])
    ,
    cats: assoc.add('cats'),
    dogs: assoc.add('dogs'),
    parrots: assoc.add('parrots')
};

var tabby = require('../')(__dirname + '/static/index.html');

var render = {
    cat: require('./render/cat.js'),
    dog: require('./render/dog.js'),
    parrot: require('./render/dog.js')
};


tabby.add('cat', require('./render/cat.js'));
tabby.render('dog', require('./render/dog.js'));
tabby.render('parrot', require('./render/parrot.js'));

var server = http.createServer(function (req, res) {
    if (tabby.test(req.url)) {
        //var s = tabby.createStream(req.url);
        res.end('TODO\n');
    }
    else ecstatic(req, res);
});
server.listen(5000);
