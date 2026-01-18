# Entra ID (Azure AD) Authentication Setup Guide

This guide explains how to configure the application to use Entra ID (formerly Azure AD) authentication instead of username/password for SQL Server connections.

## Benefits of Entra ID Authentication

- **No password management**: No need to store or rotate SQL Server passwords
- **Enhanced security**: Uses Azure Managed Identity for automatic authentication
- **Centralized access control**: Manage database access through Azure AD
- **Audit trails**: Better tracking of who accessed the database
- **Compliance**: Meets security requirements for credential-less access

## Prerequisites

1. Azure SQL Database (or SQL Managed Instance)
2. Azure Function App
3. Azure CLI installed (for local development)
4. Permissions to configure Azure AD settings

## Step 1: Enable Entra ID Authentication on Azure SQL Server

### 1.1 Set Azure AD Admin for SQL Server

1. Go to Azure Portal → Your SQL Server resource
2. Click **"Microsoft Entra ID"** (or "Active Directory admin") in the left menu
3. Click **"Set admin"**
4. Select an Entra ID user or group as the admin
5. Click **"Select"** → **"Save"**

This user/group will be able to manage database access for other Entra ID identities.

### 1.2 Enable System-Assigned Managed Identity on Function App

1. Go to Azure Portal → Your Function App
2. Click **"Identity"** in the left menu
3. Under **"System assigned"** tab, toggle **"Status"** to **On**
4. Click **"Save"**
5. **Note the Principal (Object) ID** - you'll need this

## Step 2: Grant Database Permissions to Managed Identity

### 2.1 Connect to SQL Database using Entra ID Admin

Use one of these methods:

**Option A: Using Azure Cloud Shell**
```bash
az sql server ad-admin list --resource-group <your-resource-group> --server <your-sql-server>
```

**Option B: Using SSMS with Entra ID Authentication**
1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server
3. Authentication: **"Azure Active Directory - Universal with MFA"** (or "Azure Active Directory - Password")
4. Enter your Entra ID admin credentials

**Option C: Using Azure CLI**
```bash
# Login with Azure CLI
az login

# Connect to database using Entra ID
az sql db show-connection-string --client ado.net --server <your-sql-server> --name <your-database>
```

### 2.2 Create Database User for Managed Identity

Connect to your SQL Database and run these SQL commands:

```sql
-- Replace <function-app-name> with your actual Function App name
-- The Managed Identity name is the same as your Function App name (for system-assigned)

CREATE USER [<function-app-name>] FROM EXTERNAL PROVIDER;
GO

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER [<function-app-name>];
ALTER ROLE db_datawriter ADD MEMBER [<function-app-name>];
ALTER ROLE db_ddladmin ADD MEMBER [<function-app-name>]; -- If you need table creation
GO

-- Verify the user was created
SELECT name, type_desc, authentication_type_desc 
FROM sys.database_principals 
WHERE name = '<function-app-name>';
GO
```

**Example:**
```sql
CREATE USER [person-location-api-12345] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [person-location-api-12345];
ALTER ROLE db_datawriter ADD MEMBER [person-location-api-12345];
ALTER ROLE db_ddladmin ADD MEMBER [person-location-api-12345];
```

## Step 3: Configure Function App Application Settings

### 3.1 Remove Old Connection String

Remove or don't set `SqlConnectionString` with username/password.

### 3.2 Add New Settings

In Azure Portal → Function App → **Configuration** → **Application settings**, add:

**Setting 1: SqlServer**
- Name: `SqlServer`
- Value: `tcp:<your-sql-server>.database.windows.net,1433`
- Example: `tcp:person-location-server-12345.database.windows.net,1433`

**Setting 2: SqlDatabase**
- Name: `SqlDatabase`
- Value: `PersonLocationDB` (or your database name)

**Setting 3: UseEntraId**
- Name: `UseEntraId`
- Value: `true`

**Setting 4: EncryptionKey** (still needed)
- Name: `EncryptionKey`
- Value: Your 32-character encryption key

### 3.3 Using Azure CLI

```bash
# Set SQL Server
az functionapp config appsettings set \
  --resource-group <your-resource-group> \
  --name <your-function-app-name> \
  --settings "SqlServer=tcp:<your-sql-server>.database.windows.net,1433"

# Set SQL Database
az functionapp config appsettings set \
  --resource-group <your-resource-group> \
  --name <your-function-app-name> \
  --settings "SqlDatabase=PersonLocationDB"

# Enable Entra ID authentication
az functionapp config appsettings set \
  --resource-group <your-resource-group> \
  --name <your-function-app-name> \
  --settings "UseEntraId=true"
```

## Step 4: Local Development Setup

For local development, you can still use connection strings OR configure Azure CLI authentication.

### Option A: Use Connection String (Simpler)

Keep using `SqlConnectionString` in `local.settings.json`:

```json
{
  "Values": {
    "SqlConnectionString": "Server=localhost;Database=PersonLocationDB;User Id=sa;Password=YourPassword;Encrypt=true;TrustServerCertificate=true;",
    "UseEntraId": "false",
    "EncryptionKey": "your-32-character-encryption-key!!"
  }
}
```

### Option B: Use Azure CLI Authentication (Closer to Production)

1. **Login to Azure CLI:**
   ```bash
   az login
   ```

2. **Set local.settings.json:**
   ```json
   {
     "Values": {
       "SqlServer": "tcp:<your-sql-server>.database.windows.net,1433",
       "SqlDatabase": "PersonLocationDB",
       "UseEntraId": "true",
       "EncryptionKey": "your-32-character-encryption-key!!"
     }
   }
   ```

   ⚠️ **Important**: You must be logged in with Azure CLI (`az login`) and have permissions to access the SQL Database.

## Step 5: Verify Setup

### 5.1 Test the Function App

1. Deploy or restart your Function App
2. Check the logs in Azure Portal → Function App → **Log stream**
3. You should see: `"Connected to SQL Server using Entra ID (Azure AD) authentication"`

### 5.2 Verify Database Access

1. Go to Azure Portal → Function App → **Functions** → `storePersonLocation` → **Test/Run**
2. Submit a test request
3. Check that data is stored in the database

### 5.3 Check Application Logs

Look for these log messages:
- ✅ `"Azure AD access token acquired successfully"`
- ✅ `"Connected to SQL Server using Entra ID (Azure AD) authentication"`
- ❌ If you see errors about token acquisition, check Managed Identity configuration

## Troubleshooting

### Error: "Failed to acquire Azure AD token"

**Possible causes:**
1. Managed Identity is not enabled on Function App
   - **Solution**: Enable it in Function App → Identity → System assigned

2. Function App name doesn't match SQL user name
   - **Solution**: Ensure the database user name matches the Function App name exactly

3. Database user was not created properly
   - **Solution**: Re-run the CREATE USER SQL command as Entra ID admin

### Error: "Login failed for user"

**Possible causes:**
1. Database user doesn't have proper permissions
   - **Solution**: Grant db_datareader, db_datawriter, and db_ddladmin roles

2. Managed Identity principal ID mismatch
   - **Solution**: Verify the Function App's Managed Identity principal ID matches the SQL user

### Error: "The identity is not available"

**Possible causes:**
1. Managed Identity is disabled
   - **Solution**: Enable Managed Identity in Function App settings

2. Running locally without Azure CLI login
   - **Solution**: Run `az login` or use connection string mode

### Local Development Not Working

If local development fails with Entra ID:

1. **Use connection string mode** (set `UseEntraId=false` in local.settings.json)
2. **Or ensure Azure CLI is logged in** (`az login`) and you have database access

## Security Best Practices

1. **Use Managed Identity** in production (not user-assigned unless needed)
2. **Grant minimum required permissions** (db_datareader, db_datawriter)
3. **Regularly audit** database access and permissions
4. **Monitor** authentication failures in Application Insights
5. **Remove old connection strings** containing passwords from configuration

## Migration Checklist

- [ ] Set Entra ID admin on SQL Server
- [ ] Enable System-Assigned Managed Identity on Function App
- [ ] Create database user for Function App Managed Identity
- [ ] Grant necessary database roles
- [ ] Update Function App application settings (SqlServer, SqlDatabase, UseEntraId=true)
- [ ] Remove SqlConnectionString with password (or keep for local dev only)
- [ ] Test Function App in Azure
- [ ] Verify logs show Entra ID authentication
- [ ] Test database operations
- [ ] Update deployment documentation

## Reference

- [Azure Functions - Access Azure SQL with Managed Identity](https://learn.microsoft.com/en-us/azure/azure-functions/functions-identity-access-azure-sql-with-managed-identity)
- [Azure SQL Database - Azure AD authentication](https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-aad-overview)
- [@azure/identity npm package](https://www.npmjs.com/package/@azure/identity)
