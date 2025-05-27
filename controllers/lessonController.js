const Lesson = require("../models/lessonPlanModel");
const mentorProfileModel = require("../models/mentorProfileModel");

// GET /lessons/student
const lessonController={
 getStudentLessons : async (req, res) => {
  try {
    const lessons = await Lesson.find({ studentId: req.userId })
      .populate("mentorId", "firstName email")
      .sort({ date: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lessons." });
  }
},

// GET /lessons/mentor
getMentorLessons : async (req, res) => {
  try {
    const lessons = await Lesson.find({ mentorId: req.userId })
      .populate("studentId", "name email")
      .sort({ date: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mentor's lessons." });
  }
},

// POST /lessons/book
bookLesson: async (req, res) => {
  const { mentorId, subject, date, time } = req.body;
  try {
    // Combine date and time into a Date object
    const startTime = new Date(`${date}T${time}`);
    // Set endTime to 1 hour later
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const user= await mentorProfileModel.findById(mentorId);
    const userId=user.userId;
    const lesson = new Lesson({
      mentorId:userId,
      studentId: req.userId,
      subject,
      startTime,
      endTime,
      title: `${subject} Lesson`, // you can customize
      price: 0, // or set default or from mentor hourly rate
      status: "pending",
    });

    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Booking failed." });
  }
},
// DELETE /lessons/:id (optional)
cancelLesson : async (req, res) => {
  try {
    const lessonId=req.params.id
    const lesson = await Lesson.findById(lessonId);
    console.log(lessonId)
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    await Lesson.findByIdAndDelete(lessonId); // Use findByIdAndDelete instead of deleteOne to find and delete 
    res.json({ message: "Lesson canceled" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel lesson" });
  }
}

}

module.exports = lessonController