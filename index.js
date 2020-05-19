'use strict';

const spider = new (require('./src/spider/spider'));
const BTClient = require('./src/btclient/btclient');
const save = require('./src/mysql/index');
const PORT = 6339;

let btClient = new BTClient({
    timeout: 10000,
    maxConnections: 50
});

spider.on('ensureHash', (infohash, address) => {
    btClient.add(address, infohash);
});

btClient.on('complete', (metadata, infohash, rinfo) => {
    var data = {};
    data.infohash = infohash.toString('hex');
    data.name = metadata.info.name ? metadata.info.name.toString() : '';
    data.files = 1;
    let fixfiles = new Array();
    if(metadata.info.files) {
        let files = metadata.info.files;
        let len = 0;
        files.forEach((item) => {
            fixfiles.push({
                name: item.path ? item.path.toString() : '',
                length: item.length || 0
            });
            len += item.length;
        });
        data.length = len;
    } else {
        if(metadata.info.length) {
            data.length = metadata.info.length;
        } else if(metadata.info['piece-length']) {
            data.length = metadata.info['piece-length'];
        }
    }
    data.files = fixfiles;
    data.fetcedAt = new Date().getTime();
    if(data.length > 10485760) { //只保存大于10MB的
        save(data);
    }
});

spider.listen(PORT);
