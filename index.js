var net = require('net');

// // parse "80" and "localhost:80" or even "42mEANINg-life.com:80"
// var addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;

// var addr = {
//     from: addrRegex.exec(process.argv[2]),
//     to: addrRegex.exec(process.argv[3])
// };

// if (!addr.from || !addr.to) {
//     console.log('Usage: <from> <to>');
//     return;
// }

// net.createServer(function(from) {
//     var to = net.createConnection({
//         host: addr.to[2],
//         port: addr.to[3]
//     });
//     from.pipe(to);
//     to.pipe(from);
// }).listen(addr.from[3], addr.from[2]);

let tblConn = {
    
};
let tblConnected = {
    
};

net.createServer(function(from) {
    console.log('Client connect, Client local address : ' 
    + from.localAddress + ':' 
    + from.localPort + '. client remote address : ' 
    + from.remoteAddress 
    + ':' 
    + from.remotePort);


    
    // from.end("goodbye\n");
    // from.on('data', function(data) {
    //     console.log(11, data.toString());
        
    // });
    
    from.on('data', operate);
    

    function operate(data){
        let line = readline(data);
        if( line ){
            if(line.startsWith('server:')){
                from.off('data', operate);
                let id = line.substring(7);

                if(tblConn[id] || tblConnected[id]){
                    console.log("id=" + id  + " already exist");
                    send("id=" + id  + " already exist");
                    disconnect();

                }else{
                    from.registerServerId=id;
                    tblConn[id] = from;

                    console.log("registed server with id=" + id);
                    send("registed server with id=" + id);
                }
                
            }else if(line.startsWith('connect:')){
                from.off('data', operate);
                let id = line.substring(8);

                let to = tblConn[id];
                if( to ){
                    delete tblConn[id];
                    from.pipe(to);
                    to.pipe(from);
                    console.log("connected to server id=" + id);
                    tblConnected[id] = {
                        "client": from.remoteAddress + ':' + from.remotePort,
                        "server": to.remoteAddress + ':' + to.remotePort
                    }

                   
                    // send("connected to server id=" + id);

                } else {
                    console.log("cannot connect to server id=" + id);
                    send("cannot connect to server id=" + id);
                    disconnect();
                }

            }else if(line.startsWith('admin:aisadmin')){
                send("serverId registed: " + Object.keys(tblConn) );
                // send("server registed: " +  JSON.stringify(tblConn) );
                send("connections: " + JSON.stringify(tblConnected) );

            }else{
                send("command fail, please send command server:$id OR connect:$id");
            }
        }
    }
    
    // function register(data) {
    //     let line = readline(data);
    //     if( line ){
    //         if(line.startsWith('r:')){
    //             from.off('data', register);
    //             let id = line.substring(2);
    //             tblConn[id] = from;
    //             console.log("registed connection with id=" + id);

    //             from.on('data', bind);
    //             send("registed connection with id=" + id);
    //         }else{
    //             send("please register first, send register with msg \"r:$id\"");
    //         }
    //     }
    // }


    // function bind(data) {
    //     let line = readline(data);
    //     if( line ){
    //         if(line.startsWith('c:')){
    //             from.off('data', bind);
    //             let id = line.substring(2);

    //             let to = tblConn[id];
    //             if( to ){
    //                 from.pipe(to);
    //                 to.pipe(from);
    //                 console.log("bind connection with id=" + id);
    //                 send("bind connection with id=" + id);
    //             }else{
    //                 console.log("cannot bind connection with id=" + id);
    //                 send("cannot bind connection with id=" + id);
    //             }
                
    //         }
    //     }
    // }


    let bufferData = Buffer.alloc(0);
    function readline(data){
        bufferData = Buffer.concat([bufferData, data]);
        // console.log(bufferData,bufferData.toString());
        
        let i = bufferData.indexOf('\r');
        if( i === -1 ) i = bufferData.indexOf('\n');

        if( i > -1 ) {
            let r = bufferData.slice(0,i).toString();
            bufferData = bufferData.slice(i+1);
            // console.log("remain=",bufferData);
            return r;
        }else{
            return undefined;
        }
    }

    function send(txt){
        from.write( txt + "\r\n" );
    }

    function disconnect(){
        setImmediate(()=>{
            from.destroy();
        })
    }


    from.on('end', function() {
        console.log('client disconnected');

        if(from.registerServerId){
            if( tblConn[from.registerServerId] ){
                delete tblConn[from.registerServerId];
                console.log('purge '+from.registerServerId);
            }
        }
        
    });

    
   
}).listen(12345, "0.0.0.0", function() { //'listening' listener
    console.log('server bound');
});


setTimeout(() => {
    console.log(tblConn);
    
}, 1000);