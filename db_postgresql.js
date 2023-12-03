import pg from 'pg';
const { Pool } = pg;

var sql, binds, res;

class db {
  constructor() {
    this.connection = new Pool({
      host: "db.kwnjplywneufccyzxocs.supabase.co",
      user: "postgres",
      password: "&AU$mpm_NVrt*h7",
      database: "postgres",
      port: 5432,
    });
  }

  async select(table = null, fields = null, where = [], order = null, limit = null) {
    // Connect to database

      const db_connection = await this.connection.connect();
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
    const db_connection = await this.connection.connect();

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

  async update(table, where, values) {
    // Connect to database

      const db_connection = await this.connection.connect();
    // Execute query

    if(where.length === 0) {
      where = '';
    } else {
      where = 'WHERE ' + Object.entries(where)
                        .map(([key, value]) => `${key} '${String(value).replace("'",'\'').replace('"','\"')}'`)
                        .join(' AND ');
    }

    if(values.length === 0) {
      return false;
    } else {
      values = 'SET ' + Object.entries(values)
                        .map(([key, value]) => `${key} = '${String(value).replace("'",'\'').replace('"','\"')}'`)
                        .join(', ');
    }

    sql = `UPDATE ${table}
        ${values} 
        ${where}`;

    res = await db_connection.query(sql);
    db_connection.release();
    if (res.rowCount > 0) {
      // At least one row was updated, so return true
      return true;
    } else {
      // No rows were updated, so return false
      return false;
    }
  }

  async insert(table, values) {
    if(!values || !table)
      return false;

    const db_connection = await this.connection.connect();

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
      console.log(res.rows[0]);
      return res.rows[0];
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

    const db_connection = await this.connection.connect();

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
let database_connection = new db();
let val = {
  'name': 'hey',
  'value': 'hoy',
  'added_by': '1',
  'added_on': '2023-10-28 00:19:08'
}

database_connection.insert('main', val);