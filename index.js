var mysql = require('mysql');

class Instance{
  constructor(){
    this.schema = {};
    this.connect = connect;
  }
}
/***** Table */

class Table{
  constructor(name, connection){
    this.name = name;
    this.get = (options, callback) => { get(this, options, callback) };
    this.insert = (options, callback) => { insert(this, options, callback) };
    this.edit = (options, callback) => { edit(this, options, callback) };
    this.delete = (options, callback) => { del(this, options, callback) };
    this.init = initTable;
    this.connection = connection;
  }
}
  
/*************************/

module.exports = Instance;

/******** Connection */

var connect = function (conn, callback) {
  
      conn.multipleStatements = true;
      this.connection = mysql.createConnection(conn);
  
      this.connection.connect((err) => {
  
        if (err) {
          console.error('Error occured while connecting to MySQL Database:\r\n', err);
          return;
        }
  
        this.connection.query(`SELECT table_name FROM information_schema.tables where table_schema='${conn.database}'`, (err, results, fields) => {
  
          if (err) {
            console.error('Error getting MySQL Database Tables names:\r\n', err);
            return;
          }
  
          for (var i of results) {
            this.schema[i.table_name] = new Table(i.table_name, this.connection);
            this.schema[i.table_name].init();
          }
  
        });
  
      });
  
    }

/*************************/


/***** initTable */

var initTable = function () {
  var _table = this;
  this.connection.query(
    `SHOW KEYS FROM ${this.name} WHERE Key_name = 'PRIMARY';
  SELECT REFERENCED_TABLE_NAME AS 'with', CONCAT(REFERENCED_TABLE_NAME, '.', REFERENCED_COLUMN_NAME, ' = ', COLUMN_NAME) AS 'on' FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = '${this.name}' AND REFERENCED_TABLE_NAME != TABLE_NAME;
  SHOW COLUMNS FROM ${this.name}`,
    (err, results, fields) => {

      /** Primary Keys */

      this.primaryKeys = [];
      for (var i of results[0])
        this.primaryKeys.push(i.Column_name);

      /** Foreign Keys */

      this.indexes = [];
      for (var i of results[1])
        this.indexes.push(i);

      /** Columns */

      var obj = {};
      for (var i of results[2]) {
        obj[i.Field] = (i.Default == 'CURRENT_TIMESTAMP') ? null : i.Default;
      }
      this.structure = obj;

      this.row = function (init) {
        init = init || {};
        var ret = _table.structure;
        for (var i in ret) {
          if (ret.hasOwnProperty(i) && init.hasOwnProperty(i)) ret[i] = init[i];
        }

        ret.insert = function (callback) {
          _table.insert(this, callback)
        };

        ret.update = function (callback) {
          var set = '';
          for (var i in this) {
            if (!this.hasOwnProperty(i) || typeof this[i] == 'function') continue;
            (set.length) ? set += ', ' : 0;
            set += `${i} = ${(this[i] == null) ? this[i] : '"' + this[i] + '"'}`;
          }
          var where = '';
          for (var i of _table.primaryKeys) {
            (where.length) ? where += 'AND ' : 0;
            where += `${i} = ${this[i]}`;
          }
          _table.edit({
            set: set,
            where: where
          }, callback)
        };

        ret.delete = function (callback) {
          var where = '';
          for (var i of _table.primaryKeys) {
            (where.length) ? where += 'AND ' : 0;
            where += `${i} = ${ret[i]}`;
          }
          _table.delete({
            where: where
          }, callback)
        }
        return ret;
      }

    })
}

/****************/

var get = (table, options, callback) => {
  var joinAll = options.join == 'all';

  var select = table.name + '.*';
  if (!joinAll && Array.isArray(options.select)){
    select = '';
    options.select.forEach((el) => {
      select += `,${(options.join)?table.name+'.':''}${el}`;
    })
    select = select.slice(1);
  }

  options.join = (joinAll && table.indexes) || options.join || [];
  var join = '';

  for (var indx of options.join) {
    indx.type = indx.type || '';
    join += `${indx.type} JOIN ${indx.with} ${((indx.as) ? 'AS ' + indx.as : '')} ON ${indx.on} `;

    if (joinAll) continue;
    if(Array.isArray(indx.select)){
      indx.select.forEach((el) => {
        select += `,${indx.as || indx.with}.${el}`;
      })
    }
    else
    select += `,${indx.as || indx.with}.*`;
  }

  if(options.where != null && typeof options.where == 'object'){
    var where = '';
    for (var i in options.where) {
      if (!options.where.hasOwnProperty(i) || typeof options.where[i] == 'function' || options.where[i] == undefined) continue;
      if (where.length) where += ' AND ';
      where += i + ' = ';
      if (options.where[i] == null) where += options.where[i];
      else where += `"${options.where[i]}"`;
    }
    options.where = where;
  }

  var sql =`SELECT ${select} FROM ${table.name} 
  ${join} 
  ${options.where ? 'WHERE ' + options.where : ''} 
  ${options.sort ? 'ORDER BY ' + options.sort : ''} 
  ${options.limit ? 'LIMIT ' + options.limit : ''} 
  ${options.offset ? 'OFFSET ' + options.offset : ''}`;
  //console.log(sql);
  table.connection.query(sql,
    callback)
};

var insert = (table, row, callback) => {
  var values = '';
  for (var i in row) {
    if (!row.hasOwnProperty(i) || typeof row[i] == 'function') continue;
    if (values.length) values += ', ';
    if (row[i] == null) values += row[i];
    else values += `"${row[i]}"`;
  }

  table.connection.query(
    `INSERT INTO ${table.name} VALUES (${values})`,
    callback)
};
    
var edit = (table, options, callback) => {
  table.connection.query(
    `UPDATE ${table.name} 
  ${options.set ? 'SET ' + options.set : ''}
  ${options.where ? 'WHERE ' + options.where : ''}`,
    callback)
};

var del = (table, options, callback) => {
  table.connection.query(
    `DELETE FROM ${table.name} 
  ${options.where ? 'WHERE ' + options.where : ''}`,
    callback)
};
