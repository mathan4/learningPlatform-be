const express = require('express');
const paymentRouter = express.Router();
const { verifyToken, allowRoles } = require('../middlewares/auth');
const { createCheckoutSession } = require('../controllers/paymentController');

paymentRouter.post('/checkout-session',verifyToken,allowRoles(['student']),createCheckoutSession)

module.exports=paymentRouter