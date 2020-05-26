const SPider = require('./spider');
const spider = new SPider();
const PORT = 6339;

spider.on('hash', (infohash, address) => {
    process.send({infohash, address});
});

spider.listen(PORT);