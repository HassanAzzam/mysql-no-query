var package = require('./index.js');

package.connect({
  host: 'localhost',
  user: '<user>',
  password: '<password>',
  database: '<database_name>',
  multipleStatements: true
}); 

setTimeout(() => { 

  package.schema.comments.get({}, (err, res) => { 
    console.log(res); 
  })

}, 2000);
