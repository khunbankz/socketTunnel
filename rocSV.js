const http = require('http');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
const WebSocketServer = require('websocket').server;
const axios = require('axios');


const serverWS = http.createServer();
serverWS.listen(10002);
console.log("Listening on port 10002");


// var https = require('https');
// var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
// var credentials = {key: privateKey, cert: certificate};
// var server = https.createServer(credentials);
// server.listen(3001);


const wsServer = new WebSocketServer({
  httpServer: serverWS
});
wsServer.on('request', function (request) {
  const connection = request.accept(null, request.origin);
  let id;
  connection.on('message', function (message) {
    id = message.utf8Data;
    storeCon[id] = connection;
    // console.log(Object.keys(storeCon)[0] === 'x',storeCon["x"]);
    console.log("register ws id=", robotId);
  });

  connection.on('close', function (reasonCode, description) {
    if(id){
      storeCon[id] = undefined;
      console.log("delete ws id=", robotId);
    }
  });
});


let storeCon = {};
var app = express();
var server = http.createServer(app);

app.use(bodyParser.json({
  limit: "5mb",
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/1', async (req, res, next) => {
  // console.log(storeCon);
  // console.log(req.url);

  let robotId = req.body.camera_id;
  if(storeCon[robotId]){
    storeCon[robotId].send(req.rawBody.toString());
  }


  res.json({

  });
});


app.post('/ircamera/thermaldata/', async (req, res, next) => {
  // console.log(req.body);
  // console.log(req.url);
  let robotId = req.body.camera_id;
  if(storeCon[robotId]){
    storeCon[robotId].send(req.rawBody.toString());
  }else{
    console.log("not found ws id=", robotId);
  }

  let resp = await axios.post('http://119.192.60.205:5002/ircamera/thermaldata/', req.body, {
    validateStatus: false,
    timeout: 1000,
    headers: {
      'accept-charset': req.headers['accept-charset'],
      'x-environment': req.headers['x-environment'],
      'accept': req.headers['accept'],
      'accept_language': req.headers['accept_language'],
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'accept-encoding': req.headers['accept-encoding'],
    }
  });
  console.log(resp);
  

  res.json({

  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});


server.listen(5002);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.log(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.log(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  console.log('Listening on ' + bind);
}