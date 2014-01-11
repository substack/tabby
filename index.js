var through = require('through');
var trumpet = require('trumpet');
var matcher = require('./lib/match.js');
var combine = require('stream-combiner');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

inherits(Tabby, EventEmitter);
module.exports = Tabby;

function Tabby (containerFn) {
    if (!(this instanceof Tabby)) return new Tabby(containerFn);
    EventEmitter.call(this);
    this._matcher = matcher();
    this._containerFn = containerFn || function () {};
}

Tabby.prototype.add = function (pattern, route) {
    return this._matcher.add(pattern, route);
};

Tabby.prototype.test = function (req) {
    if (req && typeof req === 'object') {
        if (req.method !== 'GET') return false;
        return this._matcher.test(req.url);
    }
    return this._matcher.test(req);
};

Tabby.prototype.handle = function (req, res) {
    var self = this;
    var m = this._matcher.match(req.url);
    if (!m) {
        res.statusCode = 404;
        res.end('not found\n');
        return;
    }
    var route = m.route, vars = m.vars, ext = m.ext;
    var params = m.params;
    
    function onerror (err) {
        err.route = route;
        err.request = req;
        err.response = res;
        
        if (self.listeners('error').length > 0) {
            self.emit('error', err, req, res);
        }
        else {
            res.statusCode = 500;
            res.end(err + '\n');
        }
    }
    
    if (ext === '.json') {
        res.setHeader('content-type', 'application/json');
        if (!route.data) {
            res.statusCode = 404;
            res.end('no data for this route\n');
            return;
        }
        var r = route.data(params);
        r.on('error', onerror);
        r.pipe(through(function (row) {
            if (typeof row === 'string' || Buffer.isBuffer(row)) {
                this.queue(row);
            }
            else {
                // TODO: inline nested streams
                this.queue(JSON.stringify(row) + '\n');
            }
        })).pipe(res);
    }
    else if (ext === '.html') {
        res.setHeader('content-type', 'text/html');
        if (route.data) {
            var r = route.data(params);
            r.on('error', onerror);
            r.pipe(route.render(params)).pipe(res);
        }
        else route.render(params).pipe(res);
    }
    else {
        res.setHeader('content-type', 'text/html');
        var tr = trumpet();
        var hs = tr.createStream('head');
        hs.pipe(through(null, function () {
            this.queue('<meta type="tabby-regex" value="'
                + encode(self._matcher.source)
                + '">\n'
            );
            this.queue(null);
        })).pipe(hs);
        
        var st = this._containerFn(route, params);
        if (!st) st = through();
        if (route.outer) st = combine(route.outer(params), st);
        
        var rx = (route.render || function () { return through() })(params);
        rx.pipe(st).pipe(tr).pipe(res);
        if (route.data) {
            var r = route.data(params);
            r.on('error', onerror);
            r.pipe(rx);
        }
    }
};

function encode (s) {
    return s.replace(/["<>]/g, function (c) {
        return { '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c];
    });
}
