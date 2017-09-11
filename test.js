var express = require('express')
var app = express()

// Including 'mysql-no-query' package.
var database = require('mysql-no-query') 

/*database.connect({
  host: 'localhost',
  user: '<username>',
  password: '<password>',
  database: '<database>'
})*/

// Connecting to database.
database.connect({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hsc_db'
})

// Specify app port as you like.
app.listen(8888);

app.get('/api/comments', (req, res) => {

  // Gets comment with id = 5.
  database.schema.comments.get({ where: 'id = 5' }, (error, results, fields) => {

    // Creates a Row object and initializing it with the data of the retrieved record 
    var record = database.schema.comments.row(results[0])

    // Let's change its text
    record.text = 'Updated!'

    // this commits the record in the database
    record.update();
    
  })

  console.log(database.schema.comments.row());

})