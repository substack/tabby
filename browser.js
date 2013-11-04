var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var url = require('url');
var through = require('through');
var matcher = require('./lib/match.js');

var canPush = Boolean(window.history.pushState);

module.exports = Tabby;
inherits(Tabby, EventEmitter);

function Tabby (element) {
    if (!(this instanceof Tabby)) return new Tabby(element);
    var self = this;
    
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    self.element = element;
    self._matcher = matcher();
    self._current = 0;
    
    var mregex = document.querySelector('meta[type=tabby-regex]');
    if (mregex) {
        self._regex = RegExp(mregex.getAttribute('value'));
        self._scan(document.body);
    }
    
    if (canPush) window.addEventListener('popstate', function (ev) {
        if (ev.state && ev.state.href) {
            self.show(ev.state.href);
        }
    });
}

Tabby.prototype._scan = function (elem) {
    var self = this;
    if (!self._regex) return;
    if (!canPush) return;
    
    var links = elem.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) (function (link) {
        var href = url.resolve(location.href, link.getAttribute('href'));
        var u = url.parse(href);
        if (location.host !== u.host) return;
        if (self._matcher.test(u.pathname) || self._regex.test(u.pathname)) {
            link.addEventListener('click', function (ev) {
                ev.preventDefault();
                
                if (!self.show(u.pathname)) return;
                window.history.pushState({ href: u.pathname }, '', u.pathname);
            });
        }
    })(links[i]);
};

Tabby.prototype.show = function (href) {
    var self = this;
    self.element.style.opacity = 0;
    self.element.innerHTML = '';
    
    var prevented = false;
    self.emit('show', href, {
        preventDefault: function () { prevented: true }
    });
    if (prevented) return false;
    
    var m = self._matcher.match(href);
    var dhref = m && m.route.render ? href + '.json' : href + '.html';
    
    var cur = ++ self._current;
    
    get(dhref, function (err, body) {
        if (self._current !== cur) return;
        if (err) location.href = href;
        
        if (m && m.route.render) {
            var r = m.route.render();
            r.appendTo(self.element);
            
            body.split('\n').forEach(function (line) {
                if (!line.length) return;
                try { var row = JSON.parse(line) }
                catch (e) { return }
                r.write(row);
            });
            r.end();
        }
        else {
            self.element.innerHTML = body;
        }
        self.emit('render', self.element);
        self._scan(self.element);
        self.element.style.opacity = 1;
    });
     
    return true;
};

Tabby.prototype.add = function (pattern, route) {
    this._matcher.add(pattern, route);
};

function get (href, cb) {
    var xhr = new XMLHttpRequest;
    xhr.open('GET', href, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.error) cb(xhr.error)
        else cb(null, xhr.responseText)
    };
    xhr.send();
}
