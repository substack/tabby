var quotemeta = require('quotemeta');

module.exports = Tabby;

function Tabby () {
    if (!(this instanceof Tabby)) return new Tabby;
    this._routes = [];
    this._groups = [];
    this._regexp = { test: function () { return false } };
}

Tabby.prototype._recreateRegexp = function () {
    var self = this;
    self._groups = [];
    var parts = self._routes.map(function (r) {
        var groups = [];
        var pattern = ('(' + quotemeta(r.pattern) + ')')
            .replace(/\\:([\w-]+)/g, function (_, x) {
                groups.push(x);
                return '([\\w-]+)';
            })
        ;
        self._groups.push({
            route: r,
            groups: groups
        });
        
        return pattern;
    });
    self._regexp = RegExp('^(?:' + parts.join('|') + ')(?:[/?]|$)');
};

Tabby.prototype.add = function (pattern, params) {
    if (pattern && typeof pattern === 'object') {
        params = pattern;
    }
    else {
        params.pattern = pattern;
    }
    
    for (var i = 0; i < this._routes.length; i++) {
        if (this._routes[i].pattern.length < params.pattern.length) {
            this._routes.splice(i, 0, params);
            break;
        }
    }
    if (i === this._routes.length) this._routes.push(params);
    
    this._recreateRegexp();
};

Tabby.prototype.test = function (req) {
    if (req && typeof req === 'object') {
        if (req.method !== 'GET') return false;
        return this._regexp.test(req.url);
    }
    return this._regexp.test(req);
};

Tabby.prototype.handle = function (req, res) {
    var m = this._regexp.exec(req.url);
    var vars = {};
    var route;
    
console.log(this._groups);
console.log(m);
    for (var i = 1; i < this._groups.length; i++) {
        var g = this._groups[i];
        if (m[i] !== undefined) {
console.log('g=', g);
            route = g.route;
            for (var j = 0; j < g.groups.length; j++) {
                vars[g.groups[j]] = m[i + j + 1];
            }
            break;
        }
        i += g.groups.length;
    }
    if (!route) {
        res.statusCode = 404;
        res.end('not found\n');
        return;
    }
    console.log(route, vars);
    
    res.end('TODO!\n');
};
