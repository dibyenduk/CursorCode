# Quick Start Guide

## Prerequisites

1. **Node.js** v18+ installed
2. **SQL Server** (local or Azure SQL Database)
3. **Azure Functions Core Tools** v4
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Configure Backend

Edit `backend/local.settings.json` and update:

**SQL Connection String:**
- For Local SQL Server: `Server=localhost;Database=PersonLocationDB;User Id=sa;Password=YourPassword;Encrypt=true;TrustServerCertificate=true;`
- For Azure SQL: `Server=tcp:your-server.database.windows.net,1433;Database=PersonLocationDB;User Id=your-user;Password=your-password;Encrypt=true;`

**Encryption Key:**
- Generate a 32-character random string (e.g., `my-secure-32-char-key-here!!`)

### 3. Start Backend

```bash
cd backend
npm start
```

Backend runs on: `http://localhost:7071`

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Configure Frontend (Optional)

Create `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:7071/api
```

### 6. Start Frontend

```bash
cd frontend
npm start
```

Frontend runs on: `http://localhost:3000`

## Testing

1. Open `http://localhost:3000` in your browser
2. Fill in:
   - Person Name: `John Doe`
   - Drop-off Location: `123 Main St, City, State`
3. Click "Store Information"
4. Check your SQL Server database - data should be stored in encrypted format in the `PersonLocation` table

## Database

The application automatically creates the `PersonLocation` table on first run. Verify it exists:

```sql
SELECT * FROM PersonLocation;
```

Note: The `EncryptedName` and `EncryptedLocation` columns contain encrypted data (hex strings).

## Troubleshooting

### Backend won't start
- Check `local.settings.json` has correct connection string
- Verify SQL Server is running and accessible
- Check port 7071 is available

### Frontend can't connect to backend
- Verify backend is running on `http://localhost:7071`
- Check `REACT_APP_API_URL` in `.env` file matches backend URL
- Check browser console for CORS errors

### Database connection errors
- Verify connection string format
- Check SQL Server firewall allows connections
- Ensure database exists and user has permissions

## Next Steps

- Deploy to Azure (see main README.md)
- Implement authentication/authorization
- Use Azure Key Vault for encryption keys in production
- Add data retrieval endpoints
- Implement data decryption utilities for authorized access
