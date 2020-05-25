const net = require('net');
const Wire = require('./wire');

process.on('message', args => {
    const {infohash, rinfo, timeout} = args;
    var successful = false;
    var socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.connect(rinfo.port, rinfo.address, function() {
        var wire = new Wire(infohash);
        socket.pipe(wire).pipe(socket);

        wire.on('metadata', function(metadata, infoHash) {
            successful = true;
            process.send({type: 'complete', metadata, infoHash, rinfo})
            socket.destroy();
        });
        wire.on('fail', function() {
            socket.destroy();
        });
        wire.sendHandshake();
    });

    socket.on('error', function(err) {
        socket.destroy();
    });

    socket.on('timeout', function(err) {
        socket.destroy();
    });

    socket.once('close', function() {
        process.send({type: 'next', infohash, successful});
    });
});