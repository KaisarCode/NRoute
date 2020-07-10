var app = require('./index');

app.use(function(req, res, next){
    next();
    console.log(req.url);
});

app.get(/\/test\?a=(\d+)/ig, function(req, res, next){
    console.log(req.pmatch);
    var out = req.url;
    res.end(out);
});

app.use(function(req, res, next){
    res.end(''); 
});

// HTTP
app.serve('http')
.listen(8888);