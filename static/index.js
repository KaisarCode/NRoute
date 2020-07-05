// Serve static files middleware
var fs = require('fs');
var url = require('url');
module.exports = function(dir, mimes) {
    dir = dir || __dirname;
    mimes = mimes || {};
    return function(req, res, next) {
        var u = url.parse(req.url);
        var p = u.path;
        var f = dir+'/'+p;
        fs.stat(f, function(err, stt) {
            if (stt && stt.isFile()) {
                var ext =
                f.split('.').pop().toLowerCase();
                var ct  = mime[ext] || 'text/plain';
                var ctv = ct+'; charset=utf-8';
                res.setHeader('Content-Type', ctv);
                res.statusCode = 200;
                var rs = fs.createReadStream(f);
                rs.on('open', function() {
                    rs.pipe(res);
                });
            } else { next(); }
        });
    }
}