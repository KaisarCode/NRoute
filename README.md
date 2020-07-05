# KCServer
Non-bloated Nodejs http server and request handler

### Install
```
npm install kc-server
```

### Use
```js
var app = require('kc-server');

app.use(function(req, res, next){
   console.log('test');
   next();
});

app.use(function(req, res, next){
   var out = req.url;
   res.end(out);
});

// HTTP
app.serve('http')
.listen(8080);

// HTTPS
var fs = require('fs');
var k = fs.readFileSync('key.pem');
var c = fs.readFileSync('crt.pem');
app.serve('https', {
   key: k,
   cert: c
}).listen(8081);
```