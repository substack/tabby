var test = require('tape');
var tabby = require('../');

test(function (t) {
    t.plan(5);
    
    var tabs = tabby();
    tabs.add('/beep', { id: 'A' });
    tabs.add('/beep/:msg', { id: 'B' });
    tabs.add('/beep/boop', { id: 'C' });
    tabs.add('/:name', { id: 'D' });
    
    t.equal(tabs._match('/beep').route.id, 'A');
    t.equal(tabs._match('/beep/xyz').route.id, 'B');
    t.equal(tabs._match('/beep/boop').route.id, 'C');
    t.equal(tabs._match('/beep/x').route.id, 'B');
    t.equal(tabs._match('/eeee').route.id, 'D');
});
