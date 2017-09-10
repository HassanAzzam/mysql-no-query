var mysql = require('mysql');

exports.DEBUG = 0;
exports.schema = {};

var connection = null;
exports.connect = function (conn) {

  connection = mysql.createConnection(conn);

  connection.connect((err) => {

    if (err) {
      console.error('Error occured while connecting to MySQL Database:\r\n', err);
      return;
    }

    exports.DEBUG ? console.log('Connected to MySQL Database...') : 0;

    connection.query(`SELECT table_name FROM information_schema.tables where table_schema='${conn.database}'`, (err, results, fields) => {

      if (err) {
        console.error('Error getting MySQL Database Tables names:\r\n', err);
        return;
      }

      exports.DEBUG ? console.log('Database tables:\r\n', results) : 0;

      for (var i of results) {
        exports.schema[i.table_name] = new table(i.table_name);
      }

    });

  });

}

var table = function (name) {
  var _table = {
    init: initTable,
    name: name,
    get: (options, callback) => {
      var joinAll = options.join == 'all';

      var select = options.select || '*';
      if (!joinAll)
        select = _table.name + '.' + select.replace(' ', '').replace(',', `, ${_table.name}.`);

      options.join = (joinAll && _table.indexes) || options.join || [];
      var join = '';

      for (var indx of options.join) {
        join += `JOIN ${indx.with} ${((indx.as) ? 'AS ' + indx.as : '')} ON ${indx.on} `;

        if (joinAll) continue;
        indx.select = indx.select || '*';
        indx.select = indx.select.replace(' ', '').replace(',', `, ${options.join.as || options.join.with}.`);
        select += `${(select.length) ? ',' : ''}${indx.as || indx.with}.${indx.select}`;
      }

      connection.query(`SELECT ${select} FROM ${name} 
      ${join} 
      ${options.where ? 'WHERE ' + options.where : ''} 
      ${options.sort ? 'SORT BY ' + options.sort : ''} 
      ${options.limit ? 'LIMIT ' + options.limit : ''} 
      ${options.offset ? 'OFFSET ' + options.offset : ''}`,
        callback)
    },
    insert: (row, callback) => {
      var values = '';
      for (var i in row) {
        if (row.hasOwnProperty(i)) {
          if (values.length) values += ', ';
          if (row[i] == null) values += row[i];
          else values += `"${row[i]}"`;
        }
      }

      connection.query(
        `INSERT INTO ${name} VALUES (${values})`,
        callback)
    },
    edit: (options, callback) => {
      connection.query(
        `UPDATE ${name} 
        ${options.set ? 'SET ' + options.set : ''}
        ${options.where ? 'WHERE ' + options.where : ''}`,
        callback)
    },
    delete: (options, callback) => {
      connection.query(
        `DELETE FROM ${name} 
        ${options.where ? 'WHERE ' + options.where : ''}`,
        callback)
    }
  };
  _table.init();
  return _table;
}

var initTable = function () {
  var _table = this;
  connection.query(
    `SHOW KEYS FROM ${_table.name} WHERE Key_name = 'PRIMARY';
    SELECT REFERENCED_TABLE_NAME AS 'with', CONCAT(REFERENCED_TABLE_NAME, '.', REFERENCED_COLUMN_NAME, ' = ', COLUMN_NAME) AS 'on' FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = '${_table.name}' AND REFERENCED_TABLE_NAME != TABLE_NAME;
    SHOW COLUMNS FROM ${_table.name}`,
    (err, results, fields) => {

      /** Primary Keys */

      _table.primaryKeys = [];
      for (var i of results[0])
        _table.primaryKeys.push(i.Column_name);

      /** Foreign Keys */

      _table.indexes = [];
      for (var i of results[1])
        _table.indexes.push(i);

      /** Columns */

      var obj = {};
      for (var i of results[2]) {
        obj[i.Field] = i.Default;
      }
      obj.date_added = null;
      _table.structure = obj;

      _table.row = function (init) {
        init = init || {};
        var ret = _table.structure;
        for (var i in ret) {
          if (ret.hasOwnProperty(i) && init.hasOwnProperty(i)) ret[i] = init[i];
        }

        ret.update = function () {
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
          })
        };

        ret.delete = function () {
          var where = '';
          for (var i of _table.primaryKeys) {
            (where.length) ? where += 'AND ' : 0;
            where += `${i} = ${ret[i]}`;
          }
          _table.delete({
            where: where
          })
        }
        return ret;
      }

    })
}