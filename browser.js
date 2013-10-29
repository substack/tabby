var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var url = require('url');

var canPush = Boolean(window.history.pushState);

module.exports = Tabby;
inherits(Tabby, EventEmitter);

function Tabby (element) {
    if (!(this instanceof Tabby)) return new Tabby(element);
    var self = this;
    
    self.element = element;
    var meta = document.querySelector('meta[type=tabby-regex]');
    
    if (meta) {
        self._regex = RegExp(meta.getAttribute('value'));
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
                
                self.show(u.pathname);
                window.history.pushState({ href: u.pathname }, '', u.pathname);
            });
        }
    })(links[i]);
};

Tabby.prototype.show = function (href) {
    console.log('TODO: serve ', href);
};
