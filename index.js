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
        req.pathname = urlp.pathname || '/';
        
        // Raw body
        req.body = '';
        req.on('data', function(c){
        c = c+''; req.body += c; });
        
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
        try { req.form =
        qry(req.body)
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
        if (req.cookie['lang']) req.lang = req.cookie['lang'];
        if (req.query['lang'])  req.lang = req.query['lang'];
        if (!req.lang) {
            try {
            req.lang = req.headers['accept-language'];
            req.lang = req.lang.split(';')[0];
            req.lang = req.lang.split(',')[0];
            req.lang = req.lang.split('-')[0];
            } catch (err) { req.lang = 'en' }
        } req.lang = req.lang.toLowerCase();
        
        // Prepare res
        res.send = function(v) {
            typeof v == 'object'
            v = JSON.stringify(v);
            res.end(v);
        }
        
        // Call middlewares
        req.on('end', function(c){
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
