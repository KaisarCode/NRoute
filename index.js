/**
 * == NRoute ==
 * Non-bloated Nodejs server and request handler
 * that uses Express-inspired middlewares
 */
var fs = require('fs');

function def(v){
    return typeof v !== 'undefined';
}
function isstr(v) {
    return typeof v == 'string';
}
function isrx(v) {
    return v instanceof RegExp;
}

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
    var mdi = 0; var mdw = [];
    function defMdw(mth, pth, cb) {
        cb = cb || function(){};
        if (typeof pth == 'function') {
            cb = pth;
            pth = '*';
        } mdw.push({ mth: mth, pth: pth, fnc: cb });
    }
    
    // Middlewares by method
    app.use = function(pth, cb) {
    defMdw('*', pth, cb); }
    app.get = function(pth, cb) {
    defMdw('get', pth, cb); }
    app.post = function(pth, cb) {
    defMdw('post', pth, cb); }
    app.put = function(pth, cb) {
    defMdw('put', pth, cb); }
    app.delete = function(pth, cb) {
    defMdw('delete', pth, cb); }
    app.patch = function(pth, cb) {
    defMdw('patch', pth, cb); }
    app.options = function(pth, cb) {
    defMdw('options', pth, cb); }
    
    // Call middleware stack
    function callMdw(req, res) {
        function next() {
            mdi++;
            callMdw(req, res);
        }
        if (def(mdw[mdi])) {
            var pt = mdw[mdi].pth;
            var m1 = mdw[mdi].mth;
            var m2 = req.method.toLowerCase();
            var ur = req.url.split('?')[0];
            if (m1 == m2 || m1 == '*') {
                var pass = false;
                
                // Match all paths
                if (pt == '*') pass = true;
                
                // Match literal path
                if (isstr(pt) &&
                pt == ur) { pass = true; }
                
                // Match path RegExp
                // Save rx groups in req.pmatch
                req.pmatch = req.pmatch || [];
                if (isrx(pt)) {
                    var x = pt.exec(ur);
                    if (x) {
                    x.shift();
                    delete x.index;
                    delete x.input;
                    delete x.groups;
                    for (var i = 0;
                    i < x.length; i++) {
                    req.pmatch.push(x[i]); }
                    pass = true; }
                }
                
                // Exec middleware
                if (pass) {
                    var md = mdw[mdi].fnc
                    md(req, res, next);
                } else { next(); }
            }
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