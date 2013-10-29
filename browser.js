var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

module.exports = Tabby;
inherits(Tabby, EventEmitter);

function Tabby () {
    if (!(this instanceof Tabby)) return new Tabby;
    this._tabs = {};
    this.element = document.createElement('div');
}

Tabby.prototype.appendTo = function (target) {
    if (typeof target === 'string') target = document.querySelector(target);
    target.appendChild(this.element);
};

Tabby.prototype.add = function (name, element) {
    this._tabs[name] = element;
    self.emit('add', name, element);
};

Tabby.prototype.show = function (name) {
    var self = this;
    Object.keys(self._tabs).forEach(function (key) {
        hide(self._tabs[name]);
    });
    show(self._tabs[name]);
    self.emit('show', name);
};

function hide (elem) {
    if (!elem.getAttribute('prev-display')) {
        var s = window.getComputedStyle(elem);
        if (s.display !== 'none') {
            elem.setAttribute('prev-display', s.display || 'block');
        }
    }
    elem.style.display = 'none'
}
function show (elem) {
    elem.style.display = elem.getAttribute('prev-display') || 'block';
}
