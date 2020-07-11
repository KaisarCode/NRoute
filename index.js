/**
 * == NRoute ==
 * Non-bloated Nodejs server and request handler
 * that uses Express-inspired middlewares
 */
var fs = require('fs');
var def = function(v){
return typeof v
!== 'undefined'; }

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
        
        // Raw body
        req.body = '';
        req.on('data', function(c){
        c = c+''; req.body += c; });
        
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