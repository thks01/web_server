const express = require("express");
const app = express();
const port = 4000; // react의 기본값은 3000이니까 3000이 아닌 아무 수
const cors = require("cors");
const bodyParser = require("body-parser");
//const mysql = require("mysql"); // mysql 모듈 사용

const connection = require("./config/db");
// const { connect } = require("./routes/user_inform");

// const corsOptions = {
//   origin: "http://localhost:4000",
//   credentials: true,
// };

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get("/userinfo", (req, res) => {
  const sql = "SELECT * FROM users";
  connection.query(sql, (err, results) => {
    if (err) {
      res.send(err);
    } else {
      res.send(results);
    }
  });
});

app.get("/groupinfo", (req, res) => {
  const sql = "SELECT * FROM groups";
  connection.query(sql, (err, results) => {
    if (err) {
      res.send(err);
    } else {
      res.send(results);
    }
  });
});

app.get("/predictioninfo", (req, res) => {
  const sql = "SELECT * FROM prediction";
  connection.query(sql, (err, results) => {
    if (err) {
      res.send(err);
    } else {
      res.send(results);
    }
  });
});

app.get("/register", (req, res) => {
  res.send("<h1>등록 페이지</h1>");
});

app.get("/login", (req, res) => {
  res.send("<h1>빠잉</h1>");
});

app.post("/register", (req, res) => {
  const body = req.body;
  connection.query("SELECT COUNT(*) FROM users", (err, result) => {
    if (result) {
      const id = result[0]["COUNT(*)"] + 1;
      const groupNum = parseInt(result[0]["COUNT(*)"] / 4) + 1;

      connection.query(
        "INSERT INTO users (id, email, password, group_num) VALUES (?, ?, ?, ?)",
        [
          id,
          // body.age,
          // body.gender,
          // body.eduBackground,
          // body.degree,
          body.email,
          body.password,
          groupNum,
        ],
        (err, result) => {
          if (result) {
            connection.query(
              "INSERT INTO prediction (user_id, group_id) VALUES (?, ?)",
              [id, groupNum]
            );

            connection.query(
              "SELECT group_size FROM sys.groups WHERE group_id = ?",
              [groupNum],
              (err, result) => {
                if (result) {
                  let group_size = result[0]["group_size"] + 1;
                  connection.query(
                    "UPDATE sys.groups SET group_size = ? WHERE group_id = ?",
                    [group_size, groupNum]
                  );
                }
              }
            );
          }
        }
      );
    }
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  connection.query(
    "SELECT u.id, u.email, g.group_type FROM sys.users AS u JOIN sys.groups AS g ON u.group_num = g.group_id WHERE u.email=? AND u.password=?",
    [email, password],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      } else {
        if (result.length > 0) {
          res.send(result);
        } else {
          res.status(404).send({ message: "실패" });
        }
      }
    }
  );
});

app.post("/survey", (req, res) => {
  const body = req.body;
  connection.query(
    "UPDATE sys.users SET age = ?, gender = ?, eduBackground = ?, degree = ? WHERE id = ?",
    [body.age, body.gender, body.eduBackground, body.degree, body.id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.send({ err: err });
      }
      if (result.length > 0) {
        console.log(result);
        res.send(result);
      } else {
        console.log(result);
        res.status(404).send({ message: "실패" });
      }
    }
  );
});

app.post("/findpassword", (req, res) => {
  const body = req.body;
  connection.query(
    "SELECT password from sys.users WHERE email = ?",
    [body.email],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }
      if (result.length > 0) {
        res.send(result);
      } else {
        res.status(404).send({ message: "실패" });
      }
    }
  );
});

app.post("/coinandcash", (req, res) => {
  const body = req.body;
  connection.query(
    "SELECT group_num from sys.users WHERE id = ?",
    [body.id],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      } else {
        connection.query(
          "SELECT num_of_coins, amount_of_cash from sys.groups WHERE group_id = ?",
          [result[0]["group_num"]],
          (err, result) => {
            if (err) {
              res.send({ err: err });
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

app.post("/membersdecision", (req, res) => {
  const body = req.body;
  let col_name = `init_price_${body.test_num}`;
  connection.query(
    "SELECT group_num from sys.users WHERE id = ?",
    [body.id],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      } else {
        connection.query(
          `SELECT user_id, ${col_name} from sys.prediction WHERE group_id = ?`,
          [result[0]["group_num"]],
          (err, result) => {
            if (err) {
              res.send({ err: err });
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

app.post("/initialPrice", (req, res) => {
  const body = req.body;
  let init_price_name = `init_price_${body.test_num}`;
  let init_dec_time_name = `init_dec_time_${body.test_num}`;
  let init_group_mean_name = `init_group_mean_${body.test_num}`;
  connection.query(
    `UPDATE sys.prediction SET ${init_price_name} = ?, ${init_dec_time_name} = ? WHERE user_id = ?`,
    [body.initialPrice, body.predTime, body.id],
    (err, result) => {
      if (result) {
        connection.query(
          "SELECT group_num FROM sys.users WHERE id = ?",
          [body.id],
          (err, result) => {
            if (result) {
              let groupNum = result[0]["group_num"];
              connection.query(
                `SELECT ${init_price_name} FROM sys.prediction WHERE group_id = ?`,
                [groupNum],
                (err, result) => {
                  if (result) {
                    let mean_of_group = 0;
                    let total = result.length;
                    for (let i = 0; i < result.length; i++) {
                      if (result[i][init_price_name] != 0) {
                        mean_of_group += result[i][init_price_name];
                      } else {
                        total -= 1;
                      }
                    }
                    mean_of_group /= total;
                    connection.query(
                      `UPDATE sys.groups SET ${init_group_mean_name} = ? WHERE group_id = ?`,
                      [mean_of_group, groupNum],
                      (err, result) => {
                        if (err) {
                          res.send({ err: err });
                        } else {
                          res.send({ result: result });
                        }
                      }
                    );
                  } else {
                    console.log(err);
                  }
                }
              );
            } else {
              console.log(err);
            }
          }
        );
      }
    }
  );
});

app.post("/whetherToChange", (req, res) => {
  const body = req.body;
  let whether_to_change_name = `whether_to_change_${body.test_num}`;
  let second_dec_time_name = `second_dec_time_${body.test_num}`;

  if (body.whetherToChange == "YES") {
    let binaryValue = 1;
  } else {
    let binaryValue = 0;
  }

  connection.query(
    `UPDATE sys.prediction SET ${whether_to_change_name} = ?, ${second_dec_time_name} = ? WHERE user_id = ?`,
    [binaryValue, body.predTime, body.id],
    (err, result) => {
      if (result) {
        console.log(result);
      } else {
        console.log(err);
      }
    }
  );
});

app.post("/finalPrice", (req, res) => {
  const body = req.body;

  let final_price_name = `final_price_${body.test_num}`;
  let final_dec_time_name = `final_dec_time_${body.test_num}`;
  let final_group_mean_name = `final_group_mean_${body.test_num}`;

  connection.query(
    `UPDATE sys.prediction SET ${final_price_name} = ?, ${final_dec_time_name} = ? WHERE user_id = ?`,
    [body.finalPrice, body.predTime, body.id],
    (err, result) => {
      if (result) {
        connection.query(
          "SELECT group_num FROM sys.users WHERE id = ?",
          [body.id],
          (err, result) => {
            if (result) {
              let groupNum = result[0]["group_num"];
              connection.query(
                `SELECT ${final_price_name} FROM sys.prediction WHERE group_id = ?`,
                [groupNum],
                (err, result) => {
                  if (result) {
                    let mean_of_group = 0;
                    let total = result.length;
                    for (let i = 0; i < result.length; i++) {
                      if (result[i][final_price_name] != 0) {
                        mean_of_group += result[i][final_price_name];
                      } else {
                        total -= 1;
                      }
                    }
                    mean_of_group /= total;
                    connection.query(
                      `UPDATE sys.groups SET ${final_group_mean_name} = ? WHERE group_id = ?`,
                      [mean_of_group, groupNum],
                      (err, result) => {
                        if (err) {
                          res.send({ err: err });
                        } else {
                          res.send({ result: result });
                        }
                      }
                    );
                  } else {
                    console.log(err);
                  }
                }
              );
            } else {
              console.log(err);
            }
          }
        );
      }
    }
  );
});

app.listen(port, () => {
  console.log(`connect at http://localhost:${port} !!!`);
});

