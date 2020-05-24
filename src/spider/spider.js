'use strict'

const dgram = require('dgram')
const Emiter = require('events')
const bencode = require('bencode')
const {Table, Node} = require('./table')
const Token = require('./token')

const bootstraps = [
    {address: "router.bittorrent.com", port:6881},
    {address: "dht.transmissionbt.com", port:6881},
    {address: "router.utorrent.com", port:6881},
    {address: "tracker.vanitycore.co", port:6969},
    {address: "inferno.demonoid.pw", port:3418},
    {address: "open.facedatabg.net", port:6969},
    {address: "tracker.mg64.net", port:6969},
    {address: "111.6.78.96", port:6969},
    {address: "90.179.64.91", port:1337},
    {address: "51.15.4.13", port:1337},
    {address: "88.198.231.1", port:1337},
    {address: "151.80.120.112", port:2710},
    {address: "191.96.249.23", port:6969},
    {address: "35.187.36.248", port:1337},
    {address: "123.249.16.65", port:2710},
    {address: "210.244.71.25", port:6969},
    {address: "9.rarbg.me", port:2710},
    {address: 'router.utorrent.com',port:6881},
    {address: "p4p.arenabg.com", port:1337},
    {address: "ipv4.tracker.harry.lu", port:80},
    {address: 'dht.transmission.com',port:6881},
    {address: "mgtracker.org", port:2710},
    {address: "tracker.coppersurfer.tk", port:6969},
    {address: "nyaa.tracker.wf", port:7777},
    {address: 'tracker.acgnx.se',port:80},
    {address: "tracker.coppersurfer.tk", port:6969},
    {address: "tracker.open-internet.nl", port:6969},
    {address: "tracker.skyts.net", port:6969},
    {address: "tracker.piratepublic.com", port:1337},
    {address: "tracker.opentrackr.org", port:1337},
    {address: "allesanddro.de", port:1337},
    {address: "public.popcorn-tracker.org", port:6969},
    {address: "wambo.club", port:1337},
    {address: "tracker4.itzmx.com", port:2710},
    {address: "tracker2.christianbro.pw", port:6969},
    {address: "thetracker.org", port:80},
    {address: "tracker1.wasabii.com.tw", port:6969},
    {address: "tracker.zer0day.to", port:1337},
    {address: "tracker.xku.tv", port:6969},
    {address: "62.138.0.158", port:6969},
    {address: "87.233.192.220", port:6969},
    {address: "78.142.19.42", port:1337},
    {address: "173.254.219.72", port:6969},
    {address: "51.15.76.199", port:6969},
    {address: "91.212.150.191", port:3418},
    {address: "103.224.212.222", port:6969},
    {address: "77.91.229.218", port:6969},
    {address: "5.79.83.193", port:6969},
    {address: "51.15.40.114", port:80},
    {address: "5.196.76.15", port:80}
    ]

function isValidPort(port) {
    return port > 0 && port < (1 << 16)
}

function generateTid() {
    return parseInt(Math.random() * 99).toString()
}

class Spider extends Emiter {
    constructor() {
        super()
        const options = arguments.length? arguments[0]: {}
        this.udp = dgram.createSocket('udp4')
        this.table = new Table(options.tableCaption || 10000)
        this.bootstraps = options.bootstraps || bootstraps
        this.token = new Token();
    }

    send(message, address) {
        const data = bencode.encode(message)
        this.udp.send(data, 0, data.length, address.port, address.address)
    }

    findNode(id, address) {
        const message = {
            t: generateTid(),
            y: 'q',
            q: 'find_node',
            a: {
                id: id,
                target: Node.generateID()
            }
        }
        this.send(message, address)
    }

    join() {
        this.bootstraps.forEach((b) => {
            this.findNode(this.table.id, b)
        })
    }

    walk() {
        let node = this.table.shift();
        if(node) {
            this.findNode(Node.neighbor(node.id, this.table.id), {address: node.address, port: node.port});
        } else {
            this.join();
        }
        setTimeout(()=>this.walk(), 2)
    }

    onFoundNodes(data) {
        const nodes = Node.decodeNodes(data)
        nodes.forEach((node) => {
            if (node.id != this.table.id && isValidPort(node.port)) {
                this.table.add(node)
            }
        })
    }

    onFindNodeRequest(message, address) {
    	const {t: tid, a: {id: nid, target: infohash}} = message

        if (tid === undefined || target.length != 20 || nid.length != 20) {
            return
        }

        this.send({
            t: tid,
            y: 'r',
            r: {
                id: Node.neighbor(nid, this.table.id),
                nodes: Node.encodeNodes(this.table.first())
            }
        }, address)
    }

    onGetPeersRequest(message, address) {
        const {t: tid, a: {id: nid, info_hash: infohash}} = message

        if (tid === undefined || infohash.length != 20 || nid.length != 20) {
            return
        }

        this.send({
            t: tid,
            y: 'r',
            r: {
                id: Node.neighbor(nid, this.table.id),
                nodes: Node.encodeNodes(this.table.first()),
                token: this.token.token
            }
        }, address)
        this.emit('unsure', infohash);
    }

    onAnnouncePeerRequest(message, address) {
        let {t: tid, a: {info_hash: infohash, token: token, id: id, implied_port: implied, port: port}} = message
        if (!tid) return

        if (!this.token.isValid(token)) return
       
        port = (implied != undefined && implied != 0) ? address.port : (port || 0)
        if (!isValidPort(port)) return

        this.send({ t: tid, y: 'r', r: { id: Node.neighbor(id, this.table.id) } }, address)
    	this.emit('ensure', infohash, {
            address: address.address,
            port: port
        })
    }

    onPingRequest(message, address) {
    	this.send({ t: message.t, y: 'r', r: { id: Node.neighbor(message.a.id, this.table.id) } }, address)
    }

    parse(data, address) {
        try {
            const message = bencode.decode(data)
            if (message.y.toString() == 'r' && message.r.nodes) {
                this.onFoundNodes(message.r.nodes)
            } else if (message.y.toString() == 'q') {
            	switch(message.q.toString()) {
            		case 'get_peers':
            		this.onGetPeersRequest(message, address)
            		break
            		case 'announce_peer':
            		this.onAnnouncePeerRequest(message, address)
            		break
            		case 'find_node':
            		this.onFindNodeRequest(message, address)
            		case 'ping':
            		this.onPingRequest(message, address)
            		break
            	}
            }
        } catch (err) {}
    }

    listen(port) {
        this.udp.bind(port)
        this.udp.on('listening', () => {
            console.log(`Listen on ${this.udp.address().address}:${this.udp.address().port}`)
        })
        this.udp.on('message', (data, addr) => {
            this.parse(data, addr)
        })
        this.udp.on('error', (err) => {})
        this.join()
        this.walk()
    }
}

module.exports = Spider;