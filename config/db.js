const mysql = require("mysql");

const db = mysql.createPool({
  host: "bitcoin.c9rgdrf0thj9.us-west-1.rds.amazonaws.com",
  user: "thsthks", //mysql의 id
  password: "abcde1234", //mysql의 password
  database: "sys", //사용할 데이터베이스
});

module.exports = db;
