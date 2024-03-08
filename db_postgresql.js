import dotenv from 'dotenv';
import pg from 'pg';
const Pool = pg.Pool;
dotenv.config({ path: dotenv.config({ path: './.env' }).error ? '../.env' : './.env' });

var sql, binds, res, db_connection;

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

class db {
  constructor() {
    this.connection = new Pool({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
      port: process.env.PORT,
    });
  }

  async select(table = null, fields = null, where = [], order = null, limit = null) {
    // Connect to database

      db_connection = await this.connection.connect();
    // Execute query

    if(fields === '') {
      fields = "*";
    }

    if(where.length === 0) {
      where = '';
    } else {
      where = 'WHERE ' + Object.entries(where)
                        .map(([key, value]) => `${key} '${String(value).replace("'",'')}'`)
                        .join(' AND ');
    }

    sql = `SELECT ${fields}
        FROM ${table} 
        ${where}`;

    if(order) {
      sql += ` ORDER BY ${order}`
    }

    if(limit) {
      sql += ` LIMIT ${limit}`
    }

    res = await db_connection.query(sql);
    db_connection.release();
      if (limit === 1) {
        return res.rows.length > 0 ? res.rows[0] : [];
      } else {
        return res.rows.length > 0 ? res.rows : [];
      }
    // return res;
  }

  async backup() {
    // Generate a timestamp for the backup file name
    const timestamp = new Date().toISOString().replace(/[-:]/g, '');

    // Formulate the backup file name with the timestamp
    const backupFile = `backup_${timestamp}.dump`;

    // Connect to the database
    db_connection = await this.connection.connect();

    // Backup the database
    try {
      const backupResult = await db_connection.query(`pg_dump -h ${this.connection.options.host} -U ${this.connection.options.user} -d ${this.connection.options.database} -F c > ${backupFile}`);
      console.log("Database backup completed.");
      return true;
    } catch (error) {
      console.error("Database backup error:", error);
      return false;
    } finally {
      db_connection.release();
    }
  }

  async update(table = null, where = null, values = null) {
    if(!table || !where || !values)
      return false;

    let where_conditon = "";

    if(values) {
      values = '' + Object.entries(values)
                        .map(([key, value]) => `${key} = '${String(value).replace("'",'').replace('"','')}'`)
                        .join(', ');
    }

    if(where) {
      where = Object.entries(where).map(([key, value]) => {
        if(!Array.isArray(value)) {
          value = [value];
        }

        let condition = "("
        condition += value.map((val) => {
          return ` ${process_where(key)} '${String(val).replace("'",'\'').replace('"','\"')}' `
        }).join('OR')
        condition += ")";

        return condition;
      }).join(' AND ');
    }

    sql = `UPDATE ${table}\n SET ${values}\n WHERE ${where}\n RETURNING *;`;

    console.log(sql);

    db_connection = await this.connection.connect();
    res = await db_connection.query(sql);
    db_connection.release();

    return (res.rowCount > 0) ? res.rows : false;
  }

  async insert(table, values) {
    if(!values || !table)
      return false;

    db_connection = await this.connection.connect();

    let fields = "";
    fields = '(' + Object.entries(values)
            .map(([key, value]) => `${key}`)
            .join(', ') + ')';

    values = 'VALUES (' + Object.entries(values)
                      .map(([key, value]) => `'${String(value).replace("'",'\'').replace('"','\"')}'`)
                      .join(', ') + ')';

    sql = `INSERT INTO ${table}
        ${fields}
        ${values}
         RETURNING *`;

    // console.log(sql);

    res = await db_connection.query(sql);
    db_connection.release();

    if (res.rows.length > 0) {
      console.log(res.rows);
      return res.rows;
    } else {
      return false;
    }
  }

  async getDetails(table = null, where = null, page = null) {
    let binds = [];
    let sql = `
      SELECT *
      FROM ${table}
      WHERE is_deleted = 0
    `;

    if (where) {
      for (const key in where) {
        sql += `
          AND ${key} = $${binds.length + 1}
        `;
        binds.push(where[key]);
      }
    }

    if (page) {
      page -= 1;
      const offset = page * 10;
      sql += ` LIMIT $${binds.length + 1}, 10`;
      binds.push(offset);
    }

    db_connection = await this.connection.connect();

    try {
      const result = await db_connection.query(sql, binds);
      db_connection.release();
      return result.rows;
    } catch (error) {
      console.error("Error executing query:", error);
      return false;
    } finally {
      db_connection.release();
    }
  }
}

// module.exports = db;
export default db;


// Testing
// let database_connection = new db();
// let val = {
//   'name': 'test name',
//   'value': 'test value',
//   'added_by': '1',
//   'added_on': '2023-10-28 00:19:08'
// }

// let where = {
//   'id': [2, 1],
// }

// database_connection.update('main', where, val);

// database_connection.insert('main', val);