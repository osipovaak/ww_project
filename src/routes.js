const express = require('express');
const mysql = require('mysql');

const CryptoJS = require("crypto-js");
const sha256 = require("crypto-js/sha256");

const connection = mysql.createPool({
    host: 'localhost',
    user: 'webuser',
    password: 'w!r3W433l',
    database: 'project_ww'
});

// We're still in routes.js! Right below everything else.

// Starting our app.
const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// login operation
app.get('/login', function (req, res) {
    const parameters = req.query;
    const sessionID = sha256(parameters.user + (new Date()).getTime());
    const sessionIDString = sessionID.toString(CryptoJS.enc.Base64);

    // Executing the MySQL query (select all data from the 'users' table).
    const loginStr = "update project_ww.users set session_id = ? where username =? and password_enc=?;";
    connection.getConnection(function (err, connection) {
        connection.query(loginStr, [sessionIDString, parameters.user, parameters.pass], function (error, results) {
            // If some error occurs, we throw an error.
            if (error)
                throw error;

            //getting the user their session string
            if (results.affectedRows > 0)
                res.send(sessionIDString);
            else
                res.send("");
            
            if (connection) connection.release();
        });
    });
});

// logout operation
app.get('/logout', function (req, res) {
    const parameters = req.query;

    //input: sessionID
    //process: set sessionID=null where sessionID = input
    //client side: clear session id from cookie
    // Executing the MySQL query (select all data from the 'users' table).
    const loginStr = "update project_ww.users set session_id=null where session_id = ?;";
    connection.getConnection(function (err, connection) {
        connection.query(loginStr, [parameters.sessionID], function (error, results) {
            // If some error occurs, we throw an error.
            if (error)
                throw error;

            //getting the user their session string
            res.send(true);
            if (connection) connection.release();
        });
    });
});

//get history of searches
app.get('/history', function (req, res) {
    const parameters = req.query;

    //input: sessionID
    //process: resolve user; get search history by user id
    //query: select * from project_ww.search_hist where user_id = (select id from project_ww.users where session_id = $sessionID);
    //client side: render all hisotry items to user

    // Executing the MySQL query (select all data from the 'users' table).
    const historyStr = "select * from project_ww.search_hist where user_id = (select id from project_ww.users where session_id = ?);";
    connection.getConnection(function (err, connection) {
        connection.query(historyStr, [parameters.sessionID], function (error, results) {
            // If some error occurs, we throw an error.
            if (error)
                throw error;

            console.log(results);
            res.send(results);
            if (connection) connection.release();
        });
    });
});

//save search
app.get('/save', function (req, res) {
    const parameters = req.query;

    //input: sessionID, search criteria, date
    //process: resolve user. insert search record into history for this user.
    //query: insert into project_ww.search_hist (user_id, search_crit, search_date, search_name) values (1, 'some other stupid shiet',  '2011-11-11', "");
    //client side: return number of affected rows, notify user of (in)valid submit

    // Executing the MySQL query (select all data from the 'users' table).
    const userIdSearch = "select id from project_ww.users where session_id = ?;";
    connection.getConnection(function (err, connection) {
        connection.query(userIdSearch, [parameters.sessionID], function (error, results) {
            // If some error occurs, we throw an error.
            if (error)
                throw error;

            //getting the user their session string
            if (results.length !== 1) {
                res.send(false);
                if (connection) connection.release();
            }
            else {
                const usrID = results[0].id;
                const insertStr = "insert into project_ww.search_hist (user_id, search_crit, search_date, search_name) values (?, ?,  ?, ?);";

                connection.query(insertStr, [usrID, parameters.foods, parameters.date, parameters.name], function (error, results) {
                    // If some error occurs, we throw an error.
                    if (error)
                        throw error;

                    if (results.affectedRows !== 1) {
                        res.send(false);
                    }

                    res.send(true);
                    if (connection) connection.release();
                    
                });
            }
        });
    });
});

// Starting our server.
app.listen(3000);

