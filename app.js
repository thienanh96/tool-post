const api = require('./router');
const express = require('express');
const path = require('path');
const port = 3000;
const cors = require('cors');
//......

var app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);
app.get('/*',function(req,res){
    res.sendFile(path.join(__dirname + '/tool new.html'));
})
var server = require('http').Server(app);
server.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port ' + port);
})