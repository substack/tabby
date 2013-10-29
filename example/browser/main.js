var tabby = require('../../')();
tabby.appendTo('#content');

var tabs = document.querySelector('#tabs');

tabs.addEventListener('click', function (ev) {
    tabby.show(ev.target.textContent);
});

[].forEach.call(tabs.querySelectorAll('#content .tab'), function (elem) {
    var name = elem.getAttribute('id').replace(/^tab-/, '');
    tabby.add(name, elem);
});
