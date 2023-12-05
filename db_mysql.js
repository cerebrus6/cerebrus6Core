// import mysql from 'mysql';
const mysql = require('mysql');
var db_connection = null;

function process_where(str = "") {
  str = str.trim();
  const last_char = str.charAt(str.length - 1);

  // Regular expression to check if the last character is a letter

  let conditions = (/[a-zA-Z]/.test(str)) && (!str.endsWith('IN'))

  if (conditions) {
    return str + ' =';
  } else {
    return str;
  }
}

function process_select_results(rows = []) {
  if(!rows)
    return false;

  const transformedRows = rows.map(row => {
    const transformedRow = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        transformedRow[key] = row[key];
      }
    }
    return transformedRow;
  });
  return transformedRows;
}

class db {
  constructor() {
    this.connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'discordbot'
    });

    // this.connection.connect((err) => {
    //   if (err) {
    //     console.error('Error connecting to MySQL:', err);
    //     throw err;
    //   }
    //   console.log('Connected to MySQL database');
    // });
  }

  async select(table = null, fields = null, where = null, limit = null, order = null) {
    // console.log(this.connection);
    // console.log(this.connection.state);
    if (!this.connection || this.connection.state === 'disconnected') {
      db_connection = await this.connection.connect();
    } else {
      db_connection = this.connection;
    }

    // Construct the SELECT query
    let sql = `SELECT ${(fields && fields !== '*') || '*'} FROM ${table}`;

    if(where) {
      sql += ' WHERE ' + Object.entries(where).map(([key, value]) => {
        if(!Array.isArray(value)) {
          value = [value];
        }

        let condition = "("
        condition += value.map((val) => {
          return ` ${process_where(key)} '${val}' `
        }).join('OR')
        condition += ")";

        return condition;
      }).join(' AND ');
    }

    if (order) {
      sql += ` ORDER BY ${order}`;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    let res = await this.query(sql);
    // try {
    //   const result = await this.query(sql);
    //   return result;
    // } catch (error) {
    //   console.error('Error executing SELECT query:', error);
    //   throw error;
    // }
    
    this.connection.end();
    res = process_select_results(res);

    if(limit === 1) {
      res = res[0] ?? false;
    }
    console.log(res);
    return res;
  }

  async update(table = null, where = null, values = null) {
    if(!table || !where || !values)
      return false;

    // if (!this.connection || this.connection.state === 'disconnected') {
    //   db_connection = await this.connection.connect();
    // } else {
    //   db_connection = this.connection;
    // }

    let sql = `UPDATE ${table}`;

    if(values) {
      sql += ' SET ' + Object.entries(values).map(([key, value]) => `${process_where(key)} '${value}'`).join(' , ');
    }

    if(where) {
      sql += ' WHERE ' + Object.entries(where).map(([key, value]) => {
        if(!Array.isArray(value)) {
          value = [value];
        }

        let condition = "("
        condition += value.map((val) => {
          return ` ${process_where(key)} '${val}' `
        }).join('OR')
        condition += ")";

        return condition;
      }).join(' AND ');
    }

    console.log(sql);
    let res = await this.query(sql);
    res = await this.select(table, '*', where);
    return res;
  }

  async insert(table, values) {
    let sql = `INSERT INTO ${table} SET ?`;

    let res = await this.query(sql, values);
    let id = res.insertId;
    res = await this.select(table, '*', {'id': id});
    return res;
  }

  async query(sql, values = []) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  async end_connection() {
    this.connection.end((err) => {
      if (err) {
        console.error('Error ending MySQL connection:', err);
        throw err;
      }
      console.log('MySQL connection ended');
    });
  }
}

module.exports = db;
// export default db;

// Testing
let database_connection = new db();
let val = {
  'name': 'dio',
  'value': 'yap',
  'added_by': '1',
  'added_on': '2023-10-28 00:19:08'
}

let where = {
  'id': [9, 1],
}

database_connection.update('main', where, val);
// database_connection.select('main', '*');

// console.log(process_where('id IN'));