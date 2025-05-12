const express = require('express');
const paymentRouter = express.Router();
const { verifyToken, allowRoles } = require('../middlewares/auth');
const { createPaymentIntent } = require('../controllers/paymentController');

paymentRouter.post('/create-payment-intent',verifyToken,allowRoles(['student']),createPaymentIntent)

module.exports=paymentRouter