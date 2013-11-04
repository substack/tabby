var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var url = require('url');
var through = require('through');
var split = require('split');
var combine = require('stream-combiner');

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
        if (location.host === u.host && self._regex.test(u.pathname)) {
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
    
    var prevented = false;
    self.emit('show', href, {
        preventDefault: function () { prevented: true }
    });
    if (prevented) return false;
    
    if (self._write) {
        clearInterval(self._renderInterval);
        
        self._write([ 'get', href ], function (err, stream, seq) {
            if (err) location.href = href;
            self._rendering = seq;
            
            var body = '', prev;
            self.element.innerHTML = body;
            self._renderInterval = setInterval(function () {
                if (self._rendering !== seq) return;
                
                if (prev !== body) {
                    self.element.innerHTML = body;
                    prev = body;
                }
                self.element.style.opacity = 1;
            }, 1000);
            
            stream.on('data', function (buf) {
                if (self._rendering !== seq) return;
                body += buf;
            });
            stream.on('end', function () {
                if (self._rendering !== seq) return;
                
                clearInterval(self._renderInterval);
                if (prev !== body) {
                    self.element.innerHTML = body;
                }
                
                self.emit('render', self.element);
                self._scan(self.element);
                self.element.style.opacity = 1;
            });
        });
    }
    else get(href + '.html', function (err, body) {
        if (err) location.href = href;
        self.element.innerHTML = body;
        self.emit('render', self.element);
        self._scan(self.element);
        
        self.element.style.opacity = 1;
    });
    
    return true;
};

Tabby.prototype.add = function (pattern, route) {
    if (typeof pattern === 'object') {
        route = pattern;
    }
    else route.pattern = pattern;
    this._routes.push(route);
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
