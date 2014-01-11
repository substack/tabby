# tabby

create web sites that span multiple tabs of content

* render plain html first, always
* if pushState is available, load additional section content dynamically over
xhr (progressive enhancement)
* append `.json` to the url of any page to get the json data that was used to
render it
* subscribe to live updates

This module *only* handles setting up the glue to pipe together the data feed
with the rendering logic at routes for presentation.

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
    render: function () {
        return fs.createReadStream(__dirname + '/static/home.html');
    }
});

tabby.add('/cats', {
    data: require('./data/cat.js')(db),
    render: require('./render/cat.js')
});

tabby.add('/cats/:name', {
    data: require('./data/cat_full.js')(db),
    render: require('./render/cat_full.js')
});

tabby.add('/owners', {
    data: require('./data/owner.js')(db),
    render: require('./render/owner.js')
});

tabby.add('/owners/:name', {
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
```

browser code:

``` js
var tabby = require('tabby')('#content');
var sock = require('shoe')('/sock');
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

## var t = tabby(outerFn)

Create a new tabby router.

If given, `outerFn(route, params)` should return a stream that transforms the
render stream values into the final content to be delivered to the request. You
can also specify the outer function on a per-route basis by setting
`route.outer` in `t.add()` below.

## t.add(pattern, route)

Add a `route` for paths matching `pattern`.

The pipeline for requests for each of `route.data(params)`,
`route.render(params)`, and `route.outer(params)` is:

``` js
data.pipe(render).pipe(outer)
```

Where only `route.render(params)` is required and the other 2 are optional.

You can put whatever other properties you want onto the route object for use in
other places in the code.

## t.test(url)

Return true if any of the patterns match for the pathname string `url`.

## t.handle(req, res)

Render all the pages that match for `t.test(req.url)`.

# browser methods

``` js
var tabby = require('tabby')
```

## var t = tabby(target)

Create a new tabby instance `t` bound to the element or query selector `target`.

## var r = t.add(pattern, route)

Add a route `r` for a `pattern` and `route` like on the server, but `r` emits
`'render'` and `'update'` events when `pattern` matches.

# server events

## t.on('error', function (err, req, res) {})

When there is an error in a data stream, this event fires. By default a listener
will catch errors:

```
function (err, req, res) {
    res.statusCode = 500;
    res.end(err + '\n');
}
```

If you handle the error yourself you will need to send a response.

# browser events

## t.on('show', function (href) {})

This event fires when a new page has been requested and on the initial page load
that was rendered server-side.

## t.on('render', function (renderStream, elem, href) {})
## r.on('render', function (renderStream, elem, href) {})

This event fires when a new render is created and on the initial page load for
rendering patterns that match.

## t.on('update', function (elem) {})
## r.on('update', function (elem) {})

When the page has been completely rendered, this event fires.

# todo

* route.live for live-streaming results

# install

With [npm](https://npmjs.org) do:

```
npm install tabby
```

# license

MIT
