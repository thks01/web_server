const mysql = require("mysql");

const db = mysql.createPool({
  host: "localhost",
  user: "root", //mysql의 id
  password: "gmlwls1014@!", //mysql의 password
  database: "bitcoin", //사용할 데이터베이스
});

module.exports = db;
