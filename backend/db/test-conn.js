const mysql = require('mysql2/promise');

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      
    });
    console.log('OK - MySQL connected successfully');
    await conn.end();
  } catch (e) {
    console.error('ERR:', e.message);
  }
}
test();
