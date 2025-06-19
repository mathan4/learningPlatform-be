const stripe = require("stripe");
const Payment = require("../models/paymentCollectionModel");
const { STRIPE_SECRET_KEY, FRONTEND_URL } = require("../utils/config");
const createLessonsForCourseStudent = require("./createLessonsForCourseStudent");

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set. Please check your .env file.");
}

const stripeClient = stripe(STRIPE_SECRET_KEY);

const paymentController = {
  createCheckoutSession: async (req, res) => {
    const {
      studentId,
      mentorId,
      amount,
      lessonId,
      courseId,
      successUrl,
      cancelUrl,
      type,
    } = req.body;

    const itemId = type === "course" ? courseId : lessonId;

    if (!studentId || !mentorId || !amount || !itemId || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!successUrl?.startsWith("http://") && !successUrl?.startsWith("https://")) {
      return res.status(400).json({ error: "Success URL must include http:// or https://" });
    }

    if (!cancelUrl?.startsWith("http://") && !cancelUrl?.startsWith("https://")) {
      return res.status(400).json({ error: "Cancel URL must include http:// or https://" });
    }

    try {
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: type === "course" ? "Course Enrollment" : "Lesson Payment",
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          studentId,
          mentorId,
          itemId,
          type,
        },
        success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
          ? successUrl
          : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      const payment = new Payment({
        studentId,
        tutorId: mentorId,
        amount,
        itemId,
        currency: "USD",
        status: "pending",
        type,
        stripeSessionId: session.id,
        courseId: type === "course" ? itemId : undefined,
        lessonId: type === "lesson" ? itemId : undefined,
      });

      await payment.save();

      // Auto-generate course lessons + Zoom after payment if type is course
      if (type === "course") {
        await createLessonsForCourseStudent(courseId, studentId);
      }

      res.send({ url: session.url });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
};

module.exports = paymentController;