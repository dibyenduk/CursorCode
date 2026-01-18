const { encrypt } = require('../src/utils/encryption');
const { insertPersonLocation } = require('../src/utils/database');

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

    const { firstName, lastName, phoneNumber, streetName, city, zipCode } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !streetName || !city || !zipCode) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: {
          error: 'All fields are required: firstName, lastName, phoneNumber, streetName, city, zipCode'
        }
      };
      return;
    }

    // Validate input types
    const requiredFields = { firstName, lastName, phoneNumber, streetName, city, zipCode };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (typeof value !== 'string') {
        context.res = {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: {
            error: `${key} must be a string`
          }
        };
        return;
      }
    }

    // Encrypt the sensitive data
    context.log('Encrypting data...');
    const encryptedFirstName = encrypt(firstName.trim());
    const encryptedLastName = encrypt(lastName.trim());
    const encryptedPhoneNumber = encrypt(phoneNumber.trim());
    const encryptedStreetName = encrypt(streetName.trim());
    const encryptedCity = encrypt(city.trim());
    const encryptedZipCode = encrypt(zipCode.trim());

    // Store in database
    context.log('Storing data in database...');
    const result = await insertPersonLocation(
      encryptedFirstName,
      encryptedLastName,
      encryptedPhoneNumber,
      encryptedStreetName,
      encryptedCity,
      encryptedZipCode
    );

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
