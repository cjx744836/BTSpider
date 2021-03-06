let mysql = require('mysql');
let connection;
function connect() {
    connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '123456',
        database : 'db_bt'
    });
    connection.connect();
    connection.on('error', err => {
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            connect();
        }
    });
}
connect();
function save(data) {
    let sql = `insert into m_hash(id, name, filesize) value("${data.infohash}", "${data.name}", "${formatLength(data.length)}")`;
    connection.query(sql, err => {
        /*if(!err && data.files.length) {
            sql = `insert into m_file(hash, name, size) values`;
            let c = [];
            data.files.forEach(d => {
               c.push(`("${data.infohash}", "${d.name}", "${formatLength(d.length)}")`);
            });
            sql += c.join();
            connection.query(sql, err => {

            })
        }*/
    });
}

function formatLength(len) {
    let t = len / 1024 / 1024 / 1024 / 1024;
    if(t >= 1) return t.toFixed(2) + 'TB';
    t = len / 1024 / 1024 / 1024;
    if(t >= 1) return t.toFixed(2) + 'GB';
    t = len / 1024 / 1024;
    if(t >= 1) return t.toFixed(2) + 'MB';
    t = len / 1024;
    return t.toFixed(2) + 'KB';
}


module.exports = save;