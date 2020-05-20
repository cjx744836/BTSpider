let mysql = require('mysql');
let connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '123456',
    database : 'db_bt'
});
connection.connect();

module.exports = connection;