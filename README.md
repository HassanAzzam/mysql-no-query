
# mysql-no-query
A middleware tool to use mysql databases' tables as JavaScript objects without writing any queries


## Installation

```sh
$ npm install mysql-no-query
```


## Quick Example

```javascript
var express = require('express')
var app = express()

// Including 'mysql-no-query' package.
var mysqlNoQuery = require('mysql-no-query') 

// Connecting to database.
var db = new mysqlNoQuery();
db.connect({
  host: 'localhost',
  user: '<username>',
  password: '<password>',
  database: '<database>'
})

// Specify app port as you like.
app.listen(8888);

app.get('/api/comments', (req, res) => {

  // This code line replaces 'SELECT * FROM comments' query, It gets all rows of 'comments' table.
  db.schema.comments.get({}, (error, results, fields) => {
    res.end(JSON.stringify(results))
  })

})
```



## Usage
### `schema.<table>`
All tables in the database can be accessed like this `database.schema.<table>`, names of the objects will be the same as the names of the tables in the database's schema.
So, if we want to access `users` table, we access it in the code like this `database.schema.users`

### `schema.<table>.get(options, callback)`
Retrieves data from `<table>` depending on specific options and triggers a callback when it ends.
`options` is required, if you don't need it set it to `{}`

#### `options`
Option | Type | Required | Description
--- | --- | --- | ---
**select** |`string` | No | specifies custom `SELECT` statement. defaults to `*`
**where** |`string` | No | adds custom `WHERE` to `SELECT` statement
**sort** |`string` | No | adds custom `SORT BY` to `SELECT` statement
**limit** |`string` | No | adds custom `LIMIT` to `SELECT` statement
**offset** |`string` | No | adds custom `OFFSET` to `SELECT` statement
**join** |[`Array<Join>`](#join-prototype) | No | adds `JOIN` to `SELECT` statement. Assign it to `'all'` instead of object to join all foreign keys of the table with its references


#### Example
```javascript
/* 
This will select first 3 comments' `text`s and their writer's `first_name`s

Equivalent to 
SELECT comments.text, writer.first_name FROM comments JOIN users AS writer ON writer.id = comments.user_id LIMIT 3;

*/
db.schema.comments.get({
    select: 'text',
    limit: 3,
    join: [{ 
      with: 'users', 
      as: 'writer', 
      on: 'writer.id = comments.user_id',  
      select: 'first_name'
    }]
  }, (error, results, fields) => {
    res.end(JSON.stringify(results))
  })
```


### `schema.<table>.insert(row, callback)`
Inserts a new record in the database table. `row` is required

#### `row`

A `Row` object of the table's structure. see [`schema.<table>.row()`](#row-prototype) for more details


### `schema.<table>.edit(options, callback)`
Updates records that are already in the database table. `row` is required

#### `options`

Option | Type | Required | Description
--- | --- | --- | ---
**set** |`string` | Yes | specifies the edited columns with its new values
**where** |`string` | No | adds custom `WHERE` to `UPDATE` statement. If not specified, all records will be updated



### `schema.<table>.delete(options, callback)`
Deletes records from the database table. `row` is required

#### `options`

Option | Type | Required | Description
--- | --- | --- | ---
**where** |`string` | No | adds custom `WHERE` to `DELETE` statement. If not specified, all records will be deleted


### `schema.<table>.row(init)`
Returns a `Row` object of the table's structure with default values

#### `init`
An object to initialize the returned `Row` object with it

---
## Prototypes

### `Join` Prototype
property | Type | Required | Description
--- | --- | --- | ---
**with** |`string` | Yes | Specifies which table to join with
**on** |`string` | Yes | Condition to which columns the join will be applied
**as** |`string` | No | Specifies alias to the joined table
**select** |`string` | No | specifies which columns to select from the joined table. defaults to `*`
**type** |`enum` | No | Specifies `JOIN` type. applicable values are `LEFT`, `RIGHT`, `INNER` or `FULL OUTER`. defaults to `FULL OUTER` 



### `Row` Prototype
Each `schema.<table>.row()` returns a different object depends on the table, but in general each one has a list of properties represents `COLUMNS_NAME`s of the table and each property equals to the default value for its column in the database.

```javascript
console.log(db.schema.comments.row())
/*  Outputs

	{ id: null,
	  user_id: null,
	  post_id: null,
	  text: null,
	  date_added: null,
	  update: [Function],
	  delete: [Function] }
  */
```

#### `update(callback)`
Updates this record in the database using the primary keys of the table
```javascript
// Gets comment with id = 5.
  db.schema.comments.get({ where: 'id = 5' }, (error, results, fields) => {

    // Creates a Row object and initializing it with the data of the retrieved record 
    var record = db.schema.comments.row(results[0])

    // Let's change its text
    record.text = 'New Text!'

    // this commits the record in the database
    record.update();
    
  })
```
#### `delete(callback)`
Deletes this record from the database using the primary keys of the table

```javascript
// Gets comment with id = 5.
  db.schema.comments.get({ where: 'id = 5' }, (error, results, fields) => {

    // Creates a Row object and initializing it with the data of the retrieved record 
    var record = db.schema.comments.row(results[0])
    
    // this deletes the record from the database
    record.delete();
    
  })
```


#### `callback`
A function to be triggered when main function is finished processing. It passes 3 parameters:
- **error**:  will be an `Error` if one occurred during the query 
- **results**: will contain the results of the query 
- **fields**: will contain information about the returned results fields (if any) 

