var app = require('./index');

app.use(function(req, res, next){
    next();
    console.log(req.url);
});

app.get(/\/test\/(\d+)/ig, function(req, res, next){
    var id = req.pmatch[0];
    var out = 'URL ID: '+id;
    res.end(out);
});

app.use(function(req, res, next){
    res.end(''); 
});

// HTTP
app.serve('http')
.listen(8888);