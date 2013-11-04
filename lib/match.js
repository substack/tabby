var quotemeta = require('quotemeta');
var qs = require('querystring');
var url = require('url');
var through = require('through');

module.exports = Match;

function Match () {
    if (!(this instanceof Match)) return new Match;
    this._routes = [];
    this._groups = [];
    this._regexp = { test: function () { return false } };
}

Match.prototype.match = function (href) {
    var m = this._regexp.exec(href);
    if (!m) return undefined;
    
    var vars = {};
    var route;
    
    for (var i = 0, j = 1; i < this._groups.length; i++) {
        var g = this._groups[i];
        if (m[j] !== undefined) {
            route = g.route;
            for (var k = 0; k < g.groups.length; k++) {
                vars[g.groups[k]] = m[j + k + 1];
            }
            break;
        }
        j += 1 + g.groups.length;
    }
    if (!route) return undefined;
    var ext = m[m.length - 1];
    
    var params = qs.parse((url.parse(href).search || '').replace(/^\?/, ''));
    Object.keys(vars).forEach(function (key) {
        params[key] = vars[key];
    });
    return { route: route, vars: vars, ext: ext, params: params };
};

Match.prototype.test = function (u) {
    return this._regexp.test(u);
};

Match.prototype._scan = function () {
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
    self._regexp = RegExp(
        '^(?:' + parts.join('|') + ')'
        + '(\.(?:json|html))?(?:[/?#]|$)'
    );
    self.source = self._regexp.source;
};

Match.prototype.add = function (pattern, route) {
    if (pattern && typeof pattern === 'object') {
        route = pattern;
    }
    else route.pattern = pattern;
    
    route.data = (function (dataFn) {
        if (!dataFn) return null;
        return function (params) {
            var st = dataFn.call(route, params, function (err, res) {
                if (err) return st.emit('error', err);
                st.queue(res);
                st.queue(null);
            });
            if (!st) st = through();
            return st;
        };
    })(route.data);
    
    var parts = route.pattern.split('/');
    (function (routes) {
        for (var i = 0; i < routes.length; i++) {
            var rparts = routes[i].pattern.split('/').slice(1);
            
            for (var j = 0; j < parts.length; j++) {
                var a = /:[\w-]+/.test(parts[j]);
                var b = /:[\w-]+/.test(rparts[j]);
                
                if (!a && b) {
                    return routes.splice(i, 0, route);
                }
                if (!a && !b
                && (!rparts[j] || parts[j].length < rparts[j].length)) {
                    return routes.splice(i, 0, route);
                }
                if (a && rparts[j] === undefined) {
                    return routes.splice(i, 0, route);
                }
            }
        }
        if (i === routes.length) routes.push(route);
    })(this._routes);
    
    this._scan();
};
