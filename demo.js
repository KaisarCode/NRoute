var app = require('./index');

app.use(function(req, res, next){
   var out = req.url;
   res.end(out);
});

// HTTP
app.serve('http')
.listen(8888);