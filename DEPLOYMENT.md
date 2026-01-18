# Deployment Guide - Azure Functions Backend & React Frontend

This guide walks you through publishing the Azure Functions backend to Azure and connecting your React frontend to it.

## Prerequisites

1. **Azure Account** with active subscription
2. **Azure CLI** installed and logged in
   ```bash
   az login
   ```
3. **Azure Functions Core Tools** v4
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

## Step 1: Create Azure Resources

### Option A: Using Azure Portal (Recommended for beginners)

#### 1.1 Create Azure SQL Database

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search "SQL Database" → Create
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new (e.g., `person-location-rg`)
   - **Database name**: `PersonLocationDB`
   - **Server**: Create new SQL Server
     - Server name: `person-location-server-{unique-id}`
     - Server admin login: `sqladmin`
     - Password: (create a strong password)
     - Location: Choose closest to you
   - **Compute + storage**: Basic tier (for development)
4. Click "Review + create" → "Create"
5. **After creation**: Note down:
   - Server name (e.g., `person-location-server-12345.database.windows.net`)
   - Admin username
   - Password

#### 1.2 Configure SQL Server Firewall

1. Go to your SQL Server resource
2. Click "Networking" → "Public access"
3. Add your current IP address (or enable "Allow Azure services and resources" for all Azure services)
4. Click "Save"

#### 1.3 Create Azure Function App

1. Go to Azure Portal → "Create a resource" → Search "Function App" → Create
2. Fill in:
   - **Subscription**: Your subscription
   - **Resource Group**: Same as SQL (e.g., `person-location-rg`)
   - **Function App name**: `person-location-api-{unique-id}` (must be globally unique)
   - **Publish**: Code
   - **Runtime stack**: Node.js
   - **Version**: 20 LTS (or latest LTS)
   - **Region**: Same as SQL Database
   - **Operating System**: Windows
   - **Plan type**: Consumption (Serverless) - for development
3. Click "Review + create" → "Create"
4. **After creation**: Note down the Function App name

### Option B: Using Azure CLI (Advanced)

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="person-location-rg"
LOCATION="eastus"
SQL_SERVER_NAME="person-location-server-$(date +%s)"
SQL_DB_NAME="PersonLocationDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="YourSecurePassword123!"
FUNCTION_APP_NAME="person-location-api-$(date +%s)"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create SQL Server
az sql server create \
  --name $SQL_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $SQL_ADMIN_USER \
  --admin-password $SQL_ADMIN_PASSWORD

# Configure firewall (allow Azure services)
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create SQL Database
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name $SQL_DB_NAME \
  --service-objective Basic

# Create Function App
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name $FUNCTION_APP_NAME \
  --storage-account $(az storage account create \
    --resource-group $RESOURCE_GROUP \
    --name $(echo $FUNCTION_APP_NAME | tr -d '-')storage \
    --location $LOCATION \
    --sku Standard_LRS \
    --query name -o tsv)

echo "Function App URL: https://$FUNCTION_APP_NAME.azurewebsites.net"
```

## Step 2: Configure Application Settings in Azure

### 2.1 Set Environment Variables in Function App

1. Go to your Function App in Azure Portal
2. Navigate to "Configuration" → "Application settings"
3. Click "+ New application setting" and add:

   **Setting 1:**
   - Name: `SqlConnectionString`
   - Value: `Server=tcp:YOUR_SERVER_NAME.database.windows.net,1433;Database=PersonLocationDB;User ID=YOUR_USERNAME;Password=YOUR_PASSWORD;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;`
   - Replace `YOUR_SERVER_NAME`, `YOUR_USERNAME`, `YOUR_PASSWORD` with your actual values

   **Setting 2:**
   - Name: `EncryptionKey`
   - Value: Generate a 32-character random string (e.g., `my-secure-32-char-key-here!!`)
   - ⚠️ **Important**: Keep this secure! Use Azure Key Vault in production.

4. Click "Save" (this will restart your Function App)

### 2.2 Using Azure CLI (Alternative)

```bash
# Set SQL Connection String
az functionapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --settings "SqlConnectionString=Server=tcp:$SQL_SERVER_NAME.database.windows.net,1433;Database=$SQL_DB_NAME;User ID=$SQL_ADMIN_USER;Password=$SQL_ADMIN_PASSWORD;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"

# Set Encryption Key (replace with your own)
az functionapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --settings "EncryptionKey=your-32-character-encryption-key!!"
```

## Step 3: Publish Backend to Azure

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Publish Function App

```bash
# Make sure you're in the backend directory
cd backend

# Publish to Azure
func azure functionapp publish <YOUR-FUNCTION-APP-NAME>
```

Replace `<YOUR-FUNCTION-APP-NAME>` with your actual Function App name from Step 1.

**Example:**
```bash
func azure functionapp publish person-location-api-12345
```

### 3.3 Verify Deployment

After publishing, you should see output like:
```
Functions in person-location-api-12345:
    storePersonLocation - [httpTrigger]
        Invoke url: https://person-location-api-12345.azurewebsites.net/api/storePersonLocation
```

**Save the Invoke URL** - you'll need it for the frontend!

## Step 4: Test the Backend

### 4.1 Test Using Azure Portal

1. Go to your Function App → "Functions" → `storePersonLocation`
2. Click "Test/Run"
3. Set method to `POST`
4. Enter request body:
   ```json
   {
     "name": "Test User",
     "dropOffLocation": "123 Test St, Test City"
   }
   ```
5. Click "Run"
6. Check the output - should return success with ID

### 4.2 Test Using curl or Postman

```bash
curl -X POST https://YOUR-FUNCTION-APP-NAME.azurewebsites.net/api/storePersonLocation \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","dropOffLocation":"123 Test St, Test City"}'
```

## Step 5: Update Frontend to Use Published Backend

### 5.1 Create Environment File

Create `frontend/.env` file (or update existing):

```env
REACT_APP_API_URL=https://YOUR-FUNCTION-APP-NAME.azurewebsites.net/api
```

Replace `YOUR-FUNCTION-APP-NAME` with your actual Function App name.

**Example:**
```env
REACT_APP_API_URL=https://person-location-api-12345.azurewebsites.net/api
```

### 5.2 Restart Frontend Development Server

If your frontend is running:
1. Stop it (Ctrl+C)
2. Restart:
   ```bash
   cd frontend
   npm start
   ```

The frontend will now use your published Azure Functions backend!

### 5.3 For Production Build

When building for production:

```bash
cd frontend
npm run build
```

The `.env` file will be baked into the build, so make sure it has the correct Azure URL.

## Step 6: Verify End-to-End

1. Open your React app (`http://localhost:3000`)
2. Fill in the form with test data
3. Click "Store Information"
4. Check Azure Portal → SQL Database → Query editor to verify data is stored (encrypted)

## Troubleshooting

### Function App Won't Deploy

- **Issue**: "Function App not found"
  - **Solution**: Verify Function App name is correct and exists in your subscription

- **Issue**: Deployment timeout
  - **Solution**: Check network connection, try again

### Backend Returns Errors

- **Issue**: "SqlConnectionString not set"
  - **Solution**: Verify Application Settings in Azure Portal have `SqlConnectionString` set

- **Issue**: "Database connection failed"
  - **Solution**: 
    - Verify SQL Server firewall allows Azure services
    - Check connection string format
    - Verify SQL Server credentials

- **Issue**: "EncryptionKey must be 32 characters"
  - **Solution**: Ensure `EncryptionKey` in Application Settings is exactly 32 characters

### Frontend Can't Connect

- **Issue**: CORS errors
  - **Solution**: Backend already includes CORS headers (`Access-Control-Allow-Origin: *`). If issues persist, check Function App CORS settings in Azure Portal.

- **Issue**: 404 Not Found
  - **Solution**: Verify `REACT_APP_API_URL` matches your Function App URL exactly

- **Issue**: Network errors
  - **Solution**: 
    - Verify Function App is running (check Azure Portal)
    - Test the endpoint directly using curl or Postman
    - Check browser console for detailed error messages

## Security Recommendations for Production

1. **Use Azure Key Vault** for encryption keys:
   ```bash
   az keyvault create --name your-keyvault-name --resource-group $RESOURCE_GROUP
   az keyvault secret set --vault-name your-keyvault-name --name EncryptionKey --value "your-32-char-key"
   ```

2. **Enable Authentication** on Function App (Azure AD, API Keys, etc.)

3. **Restrict CORS** to your frontend domain instead of `*`

4. **Enable HTTPS only** in Function App settings

5. **Use Managed Identity** for SQL Server connection (eliminates password in connection string)

6. **Enable Application Insights** for monitoring

## Next Steps

- Set up CI/CD pipeline for automatic deployments
- Configure custom domain for Function App
- Deploy frontend to Azure Static Web Apps
- Set up monitoring and alerts
- Implement authentication/authorization

## Useful Commands

```bash
# View Function App logs
func azure functionapp logstream <FUNCTION-APP-NAME>

# List all functions in your app
func azure functionapp list-functions <FUNCTION-APP-NAME>

# Get Function App URL
az functionapp show --name <FUNCTION-APP-NAME> --resource-group <RESOURCE_GROUP> --query defaultHostName -o tsv
```
