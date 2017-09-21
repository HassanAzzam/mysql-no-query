var express = require('express')
var app = express()

// Including 'mysql-no-query' package.
var mysql = require('./index.js') 
var db = new mysql();

// Connecting to database.
db.connect({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hsc_db'
})

setTimeout(() => {
  db.schema.comments.row({ text: '.insert', user_id: 29, post_id: 72 }).insert((err, res, fields) => {
    console.log(res);
  })
},
1000)
