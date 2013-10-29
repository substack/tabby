var tabby = require('../')('#content');

var section = document.querySelector('#section');

tabby.on('show', function (href) {
    var title = href.split('?')[0].split('/').slice(-1)[0];
    section.textContent = title || 'home';
});
