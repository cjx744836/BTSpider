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
function query(sql, callback) {
    connection.query(sql, (err, results) => {
        callback(err, results);
    })
}


module.exports = query;