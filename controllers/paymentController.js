const stripe = require("stripe");
const Payment = require("../models/paymentCollectionModel");
const { STRIPE_SECRET_KEY, FRONTEND_URL } = require("../utils/config");

const stripeClient = stripe(STRIPE_SECRET_KEY);

const paymentController = {
  /**
   * Creates a Stripe Checkout Session and saves a pending payment record.
   */
  createCheckoutSession: async (req, res) => {
    const { studentId, mentorId, amount, lessonId } = req.body;

    try {
      // Create Checkout Session
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Lesson Payment",
              },
              unit_amount: amount * 100, // in cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          studentId,
          mentorId,
          lessonId,
        },
        success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/payment-cancelled`,
      });

      // Save to DB as pending
      const payment = new Payment({
        lessonId,
        studentId,
        tutorId: mentorId, 
        amount,
        currency: "USD",
        status: "pending",
        stripeSessionId: session.id,
      });

      await payment.save();

      res.send({ url: session.url });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
};

module.exports = paymentController;
