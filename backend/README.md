# Person Location Management - Azure Functions Backend

This is the Azure Functions backend for storing person names and drop-off locations in encrypted format in SQL Server.

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **Azure Functions Core Tools** v4
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```
3. **SQL Server** (Local or Azure SQL Database)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Connection String

Edit `local.settings.json` and update the following:

- **SqlConnectionString**: Your SQL Server connection string
  ```
  Server=your-server.database.windows.net;Database=PersonLocationDB;User Id=your-user;Password=your-password;Encrypt=true;
  ```

- **EncryptionKey**: A 32-character encryption key (keep this secure!)
  ```
  "EncryptionKey": "your-32-char-encryption-key!!"
  ```

### 3. Database Setup

The application will automatically create the `PersonLocation` table on first run. Ensure your SQL Server is accessible and the connection string is correct.

### 4. Run Locally

```bash
npm start
# or
func start
```

The function will be available at:
```
http://localhost:7071/api/storePersonLocation
```

## Environment Variables

For production deployment, set these in Azure Function App Settings:

- `SqlConnectionString`: SQL Server connection string
- `EncryptionKey`: 32-character encryption key (use Azure Key Vault in production)

## Security Notes

⚠️ **Important**: 
- Store encryption keys securely (use Azure Key Vault in production)
- Never commit `local.settings.json` with real credentials to version control
- Use strong encryption keys (32 characters minimum)
- Enable HTTPS in production
- Consider implementing authentication/authorization

## API Endpoint

### POST /api/storePersonLocation

Stores encrypted person name and drop-off location.

**Request Body:**
```json
{
  "name": "John Doe",
  "dropOffLocation": "123 Main St, City, State"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Person location stored successfully",
  "id": 1,
  "createdAt": "2026-01-18T12:00:00.000Z"
}
```

## Encryption

Data is encrypted using AES-256-GCM before storing in the database. Each encryption uses a unique IV (Initialization Vector) for security.
