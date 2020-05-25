'use strict';

const BTClient = require('./src/btclient/btclient');
const btClient = new BTClient();
const save = require('./src/mysql/index');
const child = require('child_process').fork('./src/spider/index', {windowsHide: true, serialization: 'advanced'});


child.on('message', ({infohash, address}) => {
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

