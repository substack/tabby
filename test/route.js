var test = require('tape');
var matcher = require('../lib/match.js');

test(function (t) {
    t.plan(6);
    
    var m = matcher();
    m.add('/beep', { id: 'A' });
    m.add('/beep/:msg', { id: 'B' });
    m.add('/beep/boop', { id: 'C' });
    m.add('/:name', { id: 'D' });
    m.add('/beep/:msg/def', { id: 'E' });
    
    t.equal(m.match('/beep').route.id, 'A');
    t.equal(m.match('/beep/xyz').route.id, 'B');
    t.equal(m.match('/beep/boop').route.id, 'C');
    t.equal(m.match('/beep/x').route.id, 'B');
    t.equal(m.match('/eeee').route.id, 'D');
    t.equal(m.match('/beep/qrstuv/def').route.id, 'E');
});
