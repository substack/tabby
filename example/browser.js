var tabby = require('../')('#content');

var mews = tabby.add('/mews', {
    render: require('./tabs/mews/render.js')
});

mews.on('render', function (r, elem) {
    r.appendTo(elem);
    r.on('element', function (e) {
        console.log(e.querySelector('.message'));
    });
});

var section = document.querySelector('#section');
tabby.on('show', function (href) {
    var title = href.split('?')[0].split('/').slice(-1)[0];
    section.textContent = title || 'home';
});
