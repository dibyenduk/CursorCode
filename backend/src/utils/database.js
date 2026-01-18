const sql = require('mssql');

let poolPromise = null;

/**
 * Gets or creates a SQL Server connection pool
 */
function getPool() {
  if (!poolPromise) {
    const connectionString = process.env.SqlConnectionString;
    
    if (!connectionString) {
      throw new Error('SqlConnectionString environment variable is not set');
    }

    const config = {
      connectionString: connectionString,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    poolPromise = sql.connect(config).then(pool => {
      console.log('Connected to SQL Server');
      
      // Ensure table exists
      return ensureTableExists(pool).then(() => pool);
    }).catch(err => {
      console.error('Database connection error:', err);
      poolPromise = null;
      throw err;
    });
  }

  return poolPromise;
}

/**
 * Ensures the PersonLocation table exists with proper schema
 */
async function ensureTableExists(pool) {
  // First check if table exists
  const checkTableQuery = `
    SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PersonLocation]') AND type in (N'U')
  `;

  const tableExists = await pool.request().query(checkTableQuery);
  
  if (tableExists.recordset.length === 0) {
    // Table doesn't exist, create it
    const createTableQuery = `
      CREATE TABLE [dbo].[PersonLocation] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [EncryptedFirstName] NVARCHAR(MAX) NOT NULL,
        [EncryptedLastName] NVARCHAR(MAX) NOT NULL,
        [EncryptedPhoneNumber] NVARCHAR(MAX) NOT NULL,
        [EncryptedStreetName] NVARCHAR(MAX) NOT NULL,
        [EncryptedCity] NVARCHAR(MAX) NOT NULL,
        [EncryptedZipCode] NVARCHAR(MAX) NOT NULL,
        [CreatedAt] DATETIME2 DEFAULT GETUTCDATE() NOT NULL
      );
      
      CREATE INDEX IX_PersonLocation_CreatedAt ON [dbo].[PersonLocation]([CreatedAt]);
    `;

    try {
      await pool.request().query(createTableQuery);
      console.log('PersonLocation table created');
    } catch (err) {
      console.error('Error creating table:', err);
      throw err;
    }
  } else {
    // Table exists, check if we need to alter it to add new columns
    const checkColumnsQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'PersonLocation'
    `;
    
    const columns = await pool.request().query(checkColumnsQuery);
    const columnNames = columns.recordset.map(row => row.COLUMN_NAME);
    
    // Add missing columns if needed
    const newColumns = [];
    if (!columnNames.includes('EncryptedFirstName')) {
      newColumns.push('ALTER TABLE [dbo].[PersonLocation] ADD [EncryptedFirstName] NVARCHAR(MAX) NULL;');
    }
    if (!columnNames.includes('EncryptedLastName')) {
      newColumns.push('ALTER TABLE [dbo].[PersonLocation] ADD [EncryptedLastName] NVARCHAR(MAX) NULL;');
    }
    if (!columnNames.includes('EncryptedPhoneNumber')) {
      newColumns.push('ALTER TABLE [dbo].[PersonLocation] ADD [EncryptedPhoneNumber] NVARCHAR(MAX) NULL;');
    }
    if (!columnNames.includes('EncryptedStreetName')) {
      newColumns.push('ALTER TABLE [dbo].[PersonLocation] ADD [EncryptedStreetName] NVARCHAR(MAX) NULL;');
    }
    if (!columnNames.includes('EncryptedCity')) {
      newColumns.push('ALTER TABLE [dbo].[PersonLocation] ADD [EncryptedCity] NVARCHAR(MAX) NULL;');
    }
    if (!columnNames.includes('EncryptedZipCode')) {
      newColumns.push('ALTER TABLE [dbo].[PersonLocation] ADD [EncryptedZipCode] NVARCHAR(MAX) NULL;');
    }
    
    // If old columns exist but new ones don't, migrate or add new columns
    if (newColumns.length > 0) {
      for (const alterQuery of newColumns) {
        try {
          await pool.request().query(alterQuery);
          console.log('Added new column to PersonLocation table');
        } catch (err) {
          console.error('Error altering table:', err);
          // Don't throw, just log - table might already have columns from previous migration
        }
      }
    }
    
    console.log('PersonLocation table verified');
  }
}

/**
 * Inserts encrypted person location data into the database
 * @param {string} encryptedFirstName - Encrypted first name
 * @param {string} encryptedLastName - Encrypted last name
 * @param {string} encryptedPhoneNumber - Encrypted phone number
 * @param {string} encryptedStreetName - Encrypted street name
 * @param {string} encryptedCity - Encrypted city
 * @param {string} encryptedZipCode - Encrypted zip code
 * @returns {Promise<object>} - Inserted record
 */
async function insertPersonLocation(
  encryptedFirstName,
  encryptedLastName,
  encryptedPhoneNumber,
  encryptedStreetName,
  encryptedCity,
  encryptedZipCode
) {
  const pool = await getPool();
  
  const insertQuery = `
    INSERT INTO [dbo].[PersonLocation] (
      EncryptedFirstName, 
      EncryptedLastName, 
      EncryptedPhoneNumber, 
      EncryptedStreetName, 
      EncryptedCity, 
      EncryptedZipCode
    )
    OUTPUT INSERTED.Id, INSERTED.CreatedAt
    VALUES (
      @encryptedFirstName, 
      @encryptedLastName, 
      @encryptedPhoneNumber, 
      @encryptedStreetName, 
      @encryptedCity, 
      @encryptedZipCode
    )
  `;

  const request = pool.request();
  request.input('encryptedFirstName', sql.NVarChar, encryptedFirstName);
  request.input('encryptedLastName', sql.NVarChar, encryptedLastName);
  request.input('encryptedPhoneNumber', sql.NVarChar, encryptedPhoneNumber);
  request.input('encryptedStreetName', sql.NVarChar, encryptedStreetName);
  request.input('encryptedCity', sql.NVarChar, encryptedCity);
  request.input('encryptedZipCode', sql.NVarChar, encryptedZipCode);

  const result = await request.query(insertQuery);
  return result.recordset[0];
}

/**
 * Retrieves all person locations from the database
 * Note: Returns encrypted data - decryption should be done in the application layer
 */
async function getAllPersonLocations() {
  const pool = await getPool();
  
  const query = `
    SELECT 
      Id, 
      EncryptedFirstName, 
      EncryptedLastName, 
      EncryptedPhoneNumber, 
      EncryptedStreetName, 
      EncryptedCity, 
      EncryptedZipCode, 
      CreatedAt
    FROM [dbo].[PersonLocation]
    ORDER BY CreatedAt DESC
  `;

  const result = await pool.request().query(query);
  return result.recordset;
}

module.exports = {
  getPool,
  insertPersonLocation,
  getAllPersonLocations,
  ensureTableExists
};
