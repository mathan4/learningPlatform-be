require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const PORT = process.env.PORT;

module.exports = {
    MONGODB_URI,
    JWT_SECRET,
    EMAIL_USER,
    EMAIL_PASS,
    PORT
}