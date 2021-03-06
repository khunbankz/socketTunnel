var net = require('net');
var uuid = require("uuid");
var dateFormat = require('dateformat');

let df = "dd/mm/yyyy HH:MM:ss";
let tblConn = {};
let tblConnected = [];

net.createServer(function (from) {
    console.log('Client connect, Client local address : ' +
        from.localAddress + ':' +
        from.localPort + '. client remote address : ' +
        from.remoteAddress +
        ':' +
        from.remotePort);

    from.skId = uuid.v4();
    send("clientId=" + from.skId);
    // from.registerServerId = "";

    from.on('data', operate);

    from.setTimeout(6000);
    from.on('timeout', () => {
        console.log('socket timeout', from.skId);
        from.destroy();
        clearConn(from);
    });

    function operate(data) {
        let line = readline(data);
        if (line) {
            if (line.startsWith('server:')) {
                from.skId = "s-" + from.skId;

                from.off('data', operate);
                from.on('data', keepAlive);

                let id = line.substring(7);

                if ( tblConn[id] ) {
                    console.log("id=" + id + " already exist");
                    disconnect("id=" + id + " already exist");

                } else {
                    // from.registerServerId=id;
                    tblConn[id] = {
                        "socket" : from,
                        "date" : new Date()
                    };

                    console.log("registed server with id=" + id);
                    send("registed server with id=" + id);
                }

            } else if (line.startsWith('connect:')) {
                from.skId = "c-" + from.skId;

                from.off('data', operate);
                let id = line.substring(8);

                let to = tblConn[id];
                if (to) {
                    delete tblConn[id];
                    to = to.socket;
                    let listenerData = to.listeners('data');
                    let selectedRemoveKeepAlive;
                    for (let i = 0; i < listenerData.length; i++) {
                        if (listenerData[i].name === "keepAlive") {
                            selectedRemoveKeepAlive = listenerData[i];
                            break;
                        }
                    }
                    if (selectedRemoveKeepAlive) {
                        to.off('data', selectedRemoveKeepAlive);
                    }
                    // to.pipe(from);
                    // from.pipe(to);

                    to.on('data', (data) => {
                        // console.log(1, data, data.toString());
                        from.write(data);
                    });

                    from.on('data', (data) => {
                        // console.log(2, data, data.toString());
                        to.write(data)
                    });

                    tblConnected.push({
                        "serverId": id,
                        "date" : new Date(),
                        "server": {
                            "socket": to,
                            "socketId": to.skId
                        },
                        "client": {
                            "socket": from,
                            "socketId": from.skId
                        }
                    });

                    console.log("connected to server id=" + id);
                    send("connected to server id=" + id);
                    // send("connected", to);

                } else {
                    console.log("cannot connect to server id=" + id);
                    disconnect("cannot connect to server id=" + id);
                }

            } else if (line.startsWith('admin:aisadmin')) {
                let k = Object.keys(tblConn);
                // send("serverId registed: " + k);
                send("serverId: " + JSON.stringify(tblConn, jsonToString,2));
                send("serverId registed size: " + k.length);

                // send("server registed: " +  JSON.stringify(tblConn) );
                send("connections: " + JSON.stringify(tblConnected, jsonToString,2));
                send("connections size: " + tblConnected.length);
                send("end");

            } else {
                send("command fail, please send command server:$id OR connect:$id");
            }
        }
    }

    function keepAlive(data) {
        let line = readline(data);
        if (line) {
            if (line === 'keepAlive') {
                send("keepAlive");
            }
        } else {
            send("command not allowed");
        }
    }


    let bufferData = Buffer.alloc(0);

    function readline(data) {
        bufferData = Buffer.concat([bufferData, data]);
        // console.log(bufferData,bufferData.toString());

        let i = bufferData.indexOf('\r\n');
        if (i === -1) i = bufferData.indexOf('\n');

        if (i > -1) {
            let r = bufferData.slice(0, i);
            // console.log(bufferData[ i + 1 ]);

            bufferData = bufferData.slice(i + 2);
            // console.log("remain=",bufferData);
            return r.toString();
        } else {
            return undefined;
        }
    }

    function send(txt, socket) {
        if (socket) {
            socket.write(txt + "\r\n");
        } else {
            from.write(txt + "\r\n");
        }

    }


    function disconnect(txt) {
        // setImmediate(()=>{
        //     from.destroy();
        // })
        // console.log("END=", from.skId);
        
        if (txt) {
            from.end(txt + "\r\n");
        } else {
            from.end();
        }
    }

    
    // from.on('close', function (err) {
    //     console.log('Client close', err);
    // });
    from.on('end', function () {
        console.log('Client disconnected', "id=" + from.skId);
        clearConn(from);
        // console.log( from.destroyed );
    });

    from.on("error", (err) => {
        console.log("Client socket error", "id=" + from.skId);
        clearConn(from);
        // console.log( from.destroyed );
    });


}).listen(10001, "0.0.0.0", function () { //'listening' listener
    console.log('server bound port', 10001);
});

function jsonToString(key, value) {
    if (key === "socket") {
        return value.remoteAddress + ":" + value.remotePort + " ("+ value.skId +")";
    }else if(key === "date"){
        return dateFormat(value, df) + " (" + msToTime(Date.now() - this[key].getTime() )+")";
    }else return value;
}

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + ":" + minutes + ":" + seconds ;
  }

function clearConn(from) {
    // if(from.registerServerId){
    //     if( tblConn[from.registerServerId] ){
    //         delete tblConn[from.registerServerId];
    //         console.log('purge serverId='+from.registerServerId);
    //     }
    // }
    for (var key in tblConn) {
        let registeredSV = tblConn[key].socket;
        if (registeredSV === from) {
            delete tblConn[key];
            console.log('purge register serverId=' + key + ' clientId=' + from.skId);
            break;
        }
    }

    let removeIndex;
    for (var i = 0, len = tblConnected.length; i < len; i++) {
        if (tblConnected[i].server.socketId === from.skId) {
            removeIndex = i;
            tblConnected[i].client.socket.end();
            break;

        } else if (tblConnected[i].client.socketId === from.skId) {
            removeIndex = i;
            tblConnected[i].server.socket.end();
            break;
        }
    }

    if (removeIndex !== undefined) {
        let r = tblConnected.splice(removeIndex, 1)[0];
        console.log("Purge connection serverId=" + r.serverId + " server:" + r.server.socketId + " <=> client:" + r.client.socketId);

    }
    // console.log(from.skId, from.destroyed);
}

// setInterval(() => {
    // console.log(tblConnected);

    // tblConnected.z1.c.write( "txt" + "\r\n" );
    // tblConnected.z1.s.write( "txt" + "\r\n" );
// }, 1000);