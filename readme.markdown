# tabby

create tabbed webapps with progressive enhancement

render html first and then upgrade to websockets and pushState where available

# example

server code:

``` js
var http = require('http');
var fs = require('fs');
var ecstatic = require('ecstatic')(__dirname + '/static');
var trumpet = require('trumpet');
var duplexer = require('duplexer');

var sub = require('level-sublevel');
var db = sub(require('level')(__dirname + '/test.db', { encoding: 'json' }));

db.batch(require('./data.json'));

var tabby = require('tabby')(function (route, params) {
    var tr = trumpet();
    return duplexer(
        tr.createWriteStream('#content'),
        fs.createReadStream(__dirname + '/static/index.html').pipe(tr)
    );
});

tabby.add('/', {
    title: 'home',
    render: function () {
        return fs.createReadStream(__dirname + '/static/home.html');
    }
});

tabby.add('/cats', {
    title: 'cats',
    data: require('./data/cat.js')(db),
    render: require('./render/cat.js')
});

tabby.add('/cats/:name', {
    title: function (params) { return params.name },
    data: require('./data/cat_full.js')(db),
    render: require('./render/cat_full.js')
});

tabby.add('/owners', {
    title: 'owners',
    data: require('./data/owner.js')(db),
    render: require('./render/owner.js')
});

tabby.add('/owners/:name', {
    title: function (params) { return params.name },
    data: require('./data/owner_full.js')(db),
    render: require('./render/owner_full.js')
});

var server = http.createServer(function (req, res) {
    if (tabby.test(req)) {
        tabby.handle(req, res);
    }
    else ecstatic(req, res);
});
server.listen(5000);

var sock = require('shoe')(function (stream) {
    stream.pipe(tabby.createStream()).pipe(stream);
});
sock.install(server, '/sock');
```

The websockets at the end aren't strictly necessary. Tabby will just use xhr to
load content if a stream hasn't been configured.

browser code:

``` js
var tabby = require('tabby')('#content');
var sock = require('shoe')('/sock');
sock.pipe(tabby.createStream()).pipe(sock);
```

Each of the tabby routes has a render function, which returns a stream html.
If a data function is provided, the stream it returns is piped into the render
stream.

Here's what the simplest kind of data function might look like using leveldb:

``` js
module.exports = function (db) {
    return db.createReadStream({ start: 'cat-', end: 'cat-~' });
};
```

and a render function for this data using
[hyperspace](https://npmjs.org/package/hyperspace) could be:

``` js
var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/cat.html', 'utf8');

module.exports = function () {
    return hyperspace(html, function (row) {
        return {
            '.name': row.value.name,
            '.owner': row.value.owner
        };
    });
};
```

In addition to building each `/route` as full html, `/route.json` is built with
just the data:

```
$ curl http://localhost:5000/owners.json
{"name":"Ryan Jenkins","location":"Brooklyn","link":"/owners/ryan-jenkins"}
{"name":"Sarah West","location":"Kansas","link":"/owners/sarah-west"}
{"name":"Sir Edmund Theodore Heathcliff
IV","location":"Newcastle","link":"/owners/sir-edmund-theodore-heathcliff-iv"}
```

and `/route.html` is built with just the html fragments generated directly from
the data:

```
$ curl http://localhost:5000/owners.html
<div class="owner summary">
  <h2><a class="name" href="/owners/ryan-jenkins">Ryan Jenkins</a></h2>
  <div>
    location: <span class="location">Brooklyn</span>
  </div>
</div>
<div class="owner summary">
  <h2><a class="name" href="/owners/sarah-west">Sarah West</a></h2>
  <div>
    location: <span class="location">Kansas</span>
  </div>
</div>
<div class="owner summary">
  <h2><a class="name" href="/owners/sir-edmund-theodore-heathcliff-iv">Sir Edmund Theodore Heathcliff IV</a></h2>
  <div>
    location: <span class="location">Newcastle</span>
  </div>
</div>
```

If a stream hasn't been configured, tabby uses these routes to load content over
xhr.

# server methods

``` js
var tabby = require('tabby')
```

## var t = tabby(containerFn)

## t.add(pattern, route)

Add a `route` for paths matching `pattern`.

All routes must have a `route.render` function that returns a stream.

Routes can have a `route.data` function that will be piped into the render
function if given.

You can put whatever other properties you want onto the route object for use in
other places in the code.

## t.test(url)

Return true if any of the patterns match for the pathname string `url`.

## t.handle(req, res)

Render all the pages that match for `t.test(req.url)`.

## t.createStream()

Create a realtime data channel to communicate directly with the server.

# browser methods

``` js
var tabby = require('tabby')
```

## var t = tabby(target)

Create a new tabby instance `t` bound to the element or query selector `target`.

## t.createStream()

Hook up a request channel directly to the server.

Otherwise xhr is used to fetch content on demand.

# browser events

## t.on('show', function (href) {})

This event fires when a new page has been requested.

## t.on('render', function (elem) {})

This event fires when a new page has been fully rendered.

# todo

* route.live for live-streaming results

# install

With [npm](https://npmjs.org) do:

```
npm install tabby
```

# license

MIT
