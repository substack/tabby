var through = require('through');
var trumpet = require('trumpet');
var matcher = require('./lib/match.js');

module.exports = Tabby;

function Tabby (containerFn) {
    if (!(this instanceof Tabby)) return new Tabby(containerFn);
    this._matcher = matcher();
    this._containerFn = containerFn || function () {};
}

Tabby.prototype.add = function (pattern, route) {
    this._matcher.add(pattern, route);
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
    
    
    if (ext === '.json') {
        res.setHeader('content-type', 'application/json');
        if (!route.data) {
            res.statusCode = 404;
            res.end('no data for this route\n');
            return;
        }
        route.data(params).pipe(through(function (row) {
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
            route.data(params).pipe(route.render(params)).pipe(res);
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
        
        var rx = route.render(params);
        rx.pipe(st).pipe(tr).pipe(res);
        if (route.data) route.data(params).pipe(rx);
    }
};

function encode (s) {
    return s.replace(/["<>]/g, function (c) {
        return { '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c];
    });
}
