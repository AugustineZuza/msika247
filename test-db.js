// Test database connection
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '21chase??',
  database: 'market'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error number:', err.errno);
    return;
  }
  
  console.log('✅ Database connection successful!');
  
  connection.query('SELECT DATABASE() as current_db', (err, results) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
    } else {
      console.log('✅ Current database:', results[0].current_db);
    }
    
    connection.end();
  });
});
