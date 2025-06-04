const stripe = require("stripe");
const Payment = require("../models/paymentCollectionModel");
const { STRIPE_SECRET_KEY, FRONTEND_URL } = require("../utils/config");

const stripeClient = stripe(STRIPE_SECRET_KEY);

const paymentController = {
  /**
   * Creates a Stripe Checkout Session and saves a pending payment record.
   */
  createCheckoutSession: async (req, res) => {
    const { studentId, mentorId, amount, lessonId, successUrl, cancelUrl } = req.body;

    try {
      // Validate required fields
      if (!studentId || !mentorId || !amount || !lessonId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Use provided URLs or fallback to defaults
      const success_url = successUrl || `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = cancelUrl || `${FRONTEND_URL}/payment-cancelled`;

      // Validate URLs have proper scheme
      if (!success_url.startsWith('http://') && !success_url.startsWith('https://')) {
        return res.status(400).json({ error: "Success URL must include http:// or https://" });
      }
      if (!cancel_url.startsWith('http://') && !cancel_url.startsWith('https://')) {
        return res.status(400).json({ error: "Cancel URL must include http:// or https://" });
      }

      console.log('Creating session with URLs:', { success_url, cancel_url }); // Debug log

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
        success_url: success_url.includes('{CHECKOUT_SESSION_ID}') 
          ? success_url 
          : `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url,
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