const stripe = require("stripe");
const Payment = require("../models/paymentCollectionModel");
const { STRIPE_SECRET_KEY, FRONTEND_URL } = require("../utils/config");

const stripeClient = stripe(STRIPE_SECRET_KEY);

const paymentController = {
  /**
   * Creates a Stripe Checkout Session and saves a pending payment record.
   */
  createCheckoutSession: async (req, res) => {
    const {
      studentId,
      mentorId,
      amount,
      lessonId,
      successUrl,
      cancelUrl,
      type,
    } = req.body;
    const itemId = lessonId;

    if (!studentId || !mentorId || !amount || !lessonId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // ✅ Validate input
      if (!studentId || !mentorId || !amount || !itemId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // ✅ Validate URLs
      if (
        !successUrl?.startsWith("http://") &&
        !successUrl?.startsWith("https://")
      ) {
        return res
          .status(400)
          .json({ error: "Success URL must include http:// or https://" });
      }
      if (
        !cancelUrl?.startsWith("http://") &&
        !cancelUrl?.startsWith("https://")
      ) {
        return res
          .status(400)
          .json({ error: "Cancel URL must include http:// or https://" });
      }

      // ✅ Create Stripe Checkout Session
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name:
                  type === "course" ? "Course Enrollment" : "Lesson Payment",
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          studentId,
          mentorId, // for traceability
          itemId,
          type,
        },
        success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
          ? successUrl
          : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      // ✅ Save payment with tutorId = mentorId
      const payment = new Payment({
        lessonId: itemId,
        studentId,
        tutorId: mentorId, 
        amount,
        itemId,
        currency: "USD",
        status: "pending",
        type,
        stripeSessionId: session.id,
      });

      await payment.save();

      // ✅ Respond with Stripe checkout URL
      res.send({ url: session.url });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
};

module.exports = paymentController;
