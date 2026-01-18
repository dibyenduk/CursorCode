const { encrypt } = require('../../utils/encryption');
const { insertPersonLocation } = require('../../utils/database');

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
    return;
  }

  context.log('StorePersonLocation function processed a request.');

  try {
    // Validate request body
    if (!req.body) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: {
          error: 'Request body is required'
        }
      };
      return;
    }

    const { name, dropOffLocation } = req.body;

    // Validate required fields
    if (!name || !dropOffLocation) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: {
          error: 'Both name and dropOffLocation are required'
        }
      };
      return;
    }

    // Validate input types
    if (typeof name !== 'string' || typeof dropOffLocation !== 'string') {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: {
          error: 'Name and dropOffLocation must be strings'
        }
      };
      return;
    }

    // Encrypt the sensitive data
    context.log('Encrypting data...');
    const encryptedName = encrypt(name.trim());
    const encryptedLocation = encrypt(dropOffLocation.trim());

    // Store in database
    context.log('Storing data in database...');
    const result = await insertPersonLocation(encryptedName, encryptedLocation);

    context.log('Data stored successfully with ID:', result.Id);

    context.res = {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: {
        success: true,
        message: 'Person location stored successfully',
        id: result.Id,
        createdAt: result.CreatedAt
      }
    };

  } catch (error) {
    context.log.error('Error in StorePersonLocation:', error);

    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred while storing the data';

    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: {
        error: errorMessage
      }
    };
  }
};
