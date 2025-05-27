require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const STRIPE_SECRET_KEY=process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL=process.env.FRONTEND_URL;

const PORT = process.env.PORT;

module.exports = {
    MONGODB_URI,
    JWT_SECRET,
    ZOOM_ACCOUNT_ID,
    ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET,
    STRIPE_SECRET_KEY,
    FRONTEND_URL,
    EMAIL_USER,
    EMAIL_PASS,
    PORT
}