import mysql from 'mysql';

function process_where(str = "") {
  str = str.trim();
  const last_char = str.charAt(str.length - 1);

  // Regular expression to check if the last character is a letter
  const endsWithLetter = /[a-zA-Z]/.test(last_char);

  if (endsWithLetter) {
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
      const db_connection = await this.connection.connect();
    } else {
      const db_connection = this.connection;
    }

    // Construct the SELECT query
    let sql = `SELECT ${(fields && fields !== '*') || '*'} FROM ${table}`;

    if(where) {
      sql += ' WHERE ' + Object.entries(where).map(([key, value]) => `${process_where(key)} '${value}'`).join(' AND ');
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

    if (!this.connection || this.connection.state === 'disconnected') {
      const db_connection = await this.connection.connect();
    } else {
      const db_connection = this.connection;
    }

    where = process_where(where);

    let sql = `UPDATE ${table} SET ? WHERE ?`;
    const result = db_connection.query(sql, [values, where]);
    res = await this.select(table, '*', where);
    return result.affectedRows > 0;

  }

  async insert(table, values) {
    const db_connection = await this.connection.connect();
    let sql = `INSERT INTO ${table} SET ?`;

    let res = await this.query(sql, values);
    let id = res.insertId;
    res = await this.select(table, '*', {'id': id}, 1);
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

// module.exports = db;
export default db;

// Testing
let database_connection = new db();
let val = {
  'name': 'hey',
  'value': 'hoy',
  'added_by': '1',
  'added_on': '2023-10-28 00:19:08'
}

// database_connection.insert('main', val);
database_connection.select('main', '*');