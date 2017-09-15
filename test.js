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

// Specify app port as you like.
app.listen(8888);
