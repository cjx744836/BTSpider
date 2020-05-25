'use strict'

var EventEmitter = require('events');
var util = require('util');

var PeerQueue = require('./peer-queue');
const {fork} = require('child_process');
const path = require('path');


var BTClient = function(options) {
    EventEmitter.call(this);
    options = Object.assign({}, options);
    this.timeout = options.timeout || 10000;
    this.maxConnections = options.maxConnections || 200;
    this.activeConnections = 0;
    this.peers = new PeerQueue(this.maxConnections);
    this.on('download', this._download);
    this.child = fork(path.resolve(__dirname, './child'), {windowsHide: true, serialization: 'advanced'});
    this.child.on('message', args => {
       if(args.type === 'complete') {
           this.emit('complete', args.metadata, args.infoHash, args.rinfo);
       } else if(args.type === 'next') {
           this.next(args.infohash, args.successful);
       }
    });
    if (typeof options.ignore === 'function') {
        this.ignore = options.ignore;
    }
    else {
        this.ignore = function (infohash, rinfo, ignore) {
            ignore(false);
        };
    }
};

util.inherits(BTClient, EventEmitter);

BTClient.prototype._next = function(infohash, successful) {
    var req = this.peers.shift(infohash, successful);
    if (req) {
        this.ignore(req.infohash.toString('hex'), req.rinfo, function(drop) {
            if (!drop) {
                this.emit('download', req.rinfo, req.infohash);
            }
        }.bind(this));
    }
};

BTClient.prototype.next = function(infohash, successful) {
  this.activeConnections--;
  this._next(infohash, successful);
};

BTClient.prototype._download = function(rinfo, infohash) {
    this.activeConnections++;
    this.child.send({
        rinfo,
        infohash,
        timeout: this.timeout
    })
};

BTClient.prototype.add = function(rinfo, infohash) {
    this.peers.push({infohash: infohash, rinfo: rinfo});
    if (this.activeConnections < this.maxConnections && this.peers.length() > 0) {
        this._next();
    }
};

BTClient.prototype.isIdle = function() {
    return this.peers.length() === 0;
};

module.exports = BTClient;