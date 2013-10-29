module.exports = Tabby;

function Tabby () {
    if (!(this instanceof Tabby)) return new Tabby;
}

Tabby.prototype.render = function () {};
Tabby.prototype.test = function () { return false };
