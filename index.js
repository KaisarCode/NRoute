/**
 * == NRoute ==
 * Non-bloated Nodejs server and request handler
 * that uses Express-inspired middlewares
 */
var fs = require('fs');
var def = function(v){
return typeof v
!== 'undefined'; }
var url = require('url');
var qry = require('kc-qstr');
var fwk = require('kc-fwalk');
var hdr = require('kc-headers');

var mod = function(){
    var app = this;
    app.srv = null;
    
    // Init server
    app.serve = function(prot){
       prot = prot || 'http';
       prot == 'https' ?
       app.srv = startHttps() :
       app.srv = startHttp();
       return app.srv;
    };
    
    // Listen to port
    app.listen = function(port) {
        return app.srv.listen(port);
    }
    
    // Define middleware
    var mdi = 0;
    var mdw = [];
    app.use = function(cb) {
        mdw.push(cb);
    }
    
    // Public files
    app.pub = function(dir){
        var fls = fwk(dir);
        app.use(function(req, res, next){
            var p = req.path;
            var f  = dir+p;
            if (fls.indexOf(f) > -1) {
                var r = fs.createReadStream(f);
                r.on('open', function() {
                    hdr.ctype(res, f);
                    r.pipe(res);
                });
            } else { next(); }
        }); return app;
    }
    
    // Call middleware stack
    function callMdw(req, res) {
        function next() {
            mdi++;
            callMdw(req, res);
        }
        if (def(mdw[mdi])) {
            var md = mdw[mdi];
            md(req, res, next);
        }
    }
    
    // Global request handler
    function handleReq(req, res) {
        mdi = 0;
        
        // Parse url
        var urlp =
        url.parse(req.url);
        req.query = qry(urlp.query);
        req.protocol = urlp.protocol || 'http';
        req.path = urlp.pathname || '/';
        
        // Path to ID
        req.pathid = req.url;
        req.pathid = req.pathid.replace(/-/g,'');
        req.pathid = req.pathid.split('?')[0].replace(/\//g, '-');
        req.pathid = req.pathid.replace(/^-/,'');
        req.pathid = req.pathid || 'home';
        
        // Locals
        req.ctx = {};
        req.locals = {};
        res.locals = {};
        
        // Raw body
        req.body = '';
        req.on('data', function(c){
        c = c+''; req.body += c; });
        
        // Prepare res
        res.send = function(v) {
            if (typeof v == 'object') {
                v = JSON.stringify(v);
                hdr.ctype(res, 'json');
            } else {
                hdr.ctype(res, 'html');
            } res.end(v);
        }
        
        // Call middlewares
        req.on('end', function(c){
            
            // Cookies
            req.cookie =
            qry(req.headers.cookie, ';');
            
            // JSON body
            req.json = {};
            try { req.json =
            JSON.parse(req.body)
            } catch(err){}
            
            // Form body
            req.form = {};
            try {
            if (!Object.keys(req.json).length)
            req.form = qry(req.body);
            } catch(err){}
            
            // Text body
            req.text = req.body;
            
            // Merged body
            req.body = {};
            for (var k in req.cookie) {
                req.body[k] = req.cookie[k];
            }
            for (var k in req.json) {
                req.body[k] = req.json[k];
            }
            for (var k in req.form) {
                req.body[k] = req.form[k];
            }
            for (var k in req.query) {
                req.body[k] = req.query[k];
            }
            
            // Language
            if (req.body.lang)
            req.lang = req.body.lang;
            if (!req.lang) {
                try {
                req.lang = req.headers['accept-language'];
                req.lang = req.lang.split(';')[0];
                req.lang = req.lang.split(',')[0];
                req.lang = req.lang.split('-')[0];
                } catch (err) { req.lang = 'en' }
            } req.lang = req.lang.toLowerCase();
            
            // Call middlewares
            callMdw(req, res);
        });
    }
    
    // HTTP server
    function startHttp() {
        return require('http')
        .createServer(handleReq);
    }
    
    // HTTPS server
    function startHttps(key = '', crt = '') {
        return require('https').createServer({
            key: key, cert: crt
        }, handleReq);
    }
    
    // Return
    return app;
};

// Export module
module.exports = mod();
