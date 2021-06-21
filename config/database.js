// Provides cryptographic functionality
const crypto = require('crypto').randomBytes(256).toString('hex');

// Export config object
module.exports = {
    uri: process.env.databaseUri,
    secret: crypto, // Cryto-created secret
    db: process.env.databaseName
}
