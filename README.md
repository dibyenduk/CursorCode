# Person Location Management Application

A full-stack application for securely storing person names and drop-off locations with encrypted data storage in SQL Server.

## Architecture

- **Frontend**: React.js application
- **Backend**: Azure Functions (Node.js)
- **Database**: SQL Server with encrypted data storage

## Features

- ✅ React-based user interface
- ✅ Azure Functions HTTP API
- ✅ SQL Server backend
- ✅ AES-256-GCM encryption for sensitive data
- ✅ Automatic database schema creation
- ✅ CORS support for cross-origin requests

## Project Structure

```
.
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── PersonLocationForm.js
│   │   │   └── Notification.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── backend/           # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   │   └── StorePersonLocation/
│   │   │       ├── index.js
│   │   │       └── function.json
│   │   └── utils/
│   │       ├── encryption.js
│   │       └── database.js
│   ├── host.json
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **SQL Server** (Local or Azure SQL Database)
- **Azure Functions Core Tools** v4 (for local development)
- **npm** or **yarn**

### Installation

#### 1. Backend Setup

```bash
cd backend
npm install

# Install Azure Functions Core Tools globally (if not already installed)
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

#### 2. Configure Backend

Edit `backend/local.settings.json`:

```json
{
  "Values": {
    "SqlConnectionString": "Server=your-server;Database=PersonLocationDB;User Id=sa;Password=YourPassword;Encrypt=true;TrustServerCertificate=true;",
    "EncryptionKey": "your-32-character-encryption-key!!"
  }
}
```

**Important**: 
- Replace `SqlConnectionString` with your SQL Server connection string
- Replace `EncryptionKey` with a secure 32-character encryption key
- For Azure SQL Database, use: `Server=tcp:your-server.database.windows.net,1433;Database=PersonLocationDB;User Id=your-user;Password=your-password;Encrypt=true;`

#### 3. Start Backend

```bash
cd backend
npm start
# or
func start
```

Backend will run on `http://localhost:7071`

#### 4. Frontend Setup

```bash
cd frontend
npm install
```

#### 5. Configure Frontend

Create `frontend/.env` file (optional, defaults to localhost):

```env
REACT_APP_API_URL=http://localhost:7071/api
```

For production, set this to your Azure Functions URL:
```env
REACT_APP_API_URL=https://your-function-app.azurewebsites.net/api
```

#### 6. Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on `http://localhost:3000`

## Database Schema

The application automatically creates the following table on first run:

```sql
CREATE TABLE [dbo].[PersonLocation] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [EncryptedName] NVARCHAR(MAX) NOT NULL,
    [EncryptedLocation] NVARCHAR(MAX) NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE() NOT NULL
);
```

## Security

### Encryption

- Data is encrypted using **AES-256-GCM** before storing in the database
- Each encryption uses a unique IV (Initialization Vector)
- Encryption key is stored in environment variables (use Azure Key Vault in production)

### Security Best Practices

⚠️ **Important for Production**:

1. **Use Azure Key Vault** for storing encryption keys
2. **Enable HTTPS** and use secure connections
3. **Implement authentication/authorization** (e.g., Azure AD)
4. **Never commit** `local.settings.json` or `.env` files with real credentials
5. **Use strong encryption keys** (32+ characters, random)
6. **Enable SQL Server encryption** for data at rest
7. **Use managed identities** for Azure SQL connections when possible

## API Documentation

### Store Person Location

**Endpoint**: `POST /api/storePersonLocation`

**Request**:
```json
{
  "name": "John Doe",
  "dropOffLocation": "123 Main Street, City, State 12345"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Person location stored successfully",
  "id": 1,
  "createdAt": "2026-01-18T12:00:00.000Z"
}
```

**Error Response**:
```json
{
  "error": "Error message here"
}
```

## Deployment

### Deploy to Azure

#### Backend (Azure Functions)

1. Create an Azure Function App in Azure Portal
2. Configure Application Settings:
   - `SqlConnectionString`: Your SQL Server connection string
   - `EncryptionKey`: Your 32-character encryption key (or use Key Vault reference)
3. Deploy using Azure Functions Core Tools:
   ```bash
   func azure functionapp publish <your-function-app-name>
   ```

#### Frontend (Static Web App or Azure Storage)

1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Azure Static Web Apps or Azure Storage with CDN

3. Update `REACT_APP_API_URL` to point to your Azure Functions URL

### SQL Server Setup

1. Create an Azure SQL Database (or use existing SQL Server)
2. Ensure firewall rules allow Azure Functions to connect
3. Create the database and user with appropriate permissions
4. The application will create the table automatically on first run

## Troubleshooting

### Connection Issues

- Verify SQL Server connection string format
- Check firewall rules allow connections
- Ensure SQL Server authentication is enabled
- Verify credentials are correct

### Encryption Errors

- Ensure `EncryptionKey` is exactly 32 characters
- Check that encryption key is set in environment variables
- Verify encryption utilities are correctly imported

### CORS Issues

- Backend includes CORS headers for `Access-Control-Allow-Origin: *`
- For production, restrict CORS to specific domains
- Check browser console for CORS error details

## License

This project is provided as-is for educational and development purposes.
