const stripe = require("stripe");
const Payment = require("../models/paymentCollectionModel");
const Lesson = require("../models/lessonPlanModel");
const User = require("../models/userModel");
const { STRIPE_SECRET_KEY } = require("../utils/config");

const stripeClient = stripe(STRIPE_SECRET_KEY);

const paymentController = {
  /**
   * Creates a payment intent using Stripe and stores the payment details in the database.
   * 
   * @async
   * @param {Request} req - Express request object containing `body` with `studentId`, `mentorId`, `amount`, and `lessonId`.
   * @param {Response} res - Express response object used to send the client secret and payment intent ID.
   * @returns {Promise<void>} Sends a response with the client secret and payment intent ID or an error message.
   * @throws Will log and return an error message if the payment intent creation fails.
   */

  createPaymentIntent: async (req, res) => {
    const { studentId, mentorId, amount, lessonId } = req.body;

    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const payment = new Payment({
        lessonId,
        studentId,
        mentorId,
        amount,
        currency: "USD",
        status: "pending",
        stripePaymentId: paymentIntent.id,
      });

      await payment.save();

      // Send back the client secret to the frontend for completing the payment
      res.send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

module.exports = paymentController;