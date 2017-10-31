var express = require('express');
var bodyparser = require('body-parser');
var QABot=require('./qabot.js').qabot;


function server(config) {
    var qabot=new QABot(config);
    var app = express();
    app.use(bodyparser.json());
    app.get('/', function (req, res) {
        res.send("yes");
    })
    app.post('/', function(req, res){
        qabot.newMsg(req.body.data);
        
    })
    app.listen(config.webServerPort);
}
exports.server = server;

