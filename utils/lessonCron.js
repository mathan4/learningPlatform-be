const cron = require("node-cron");
const LessonPlan = require("../models/lessonPlanModel");
const { getZoomRecordings } = require("../controllers/meetingController");

cron.schedule("*/10 * * * *", async () => {
  console.log("⏰ Running scheduled task to update completed lessons...");

  try {
    const now = new Date();

    // Mark past lessons as completed
    const updated = await LessonPlan.updateMany(
      {
        endTime: { $lt: now },
        status: { $ne: "completed" },
      },
      { $set: { status: "completed" } }
    );
    console.log(` Lessons marked completed: ${updated.modifiedCount}`);

    //  Get completed lessons with no recording URL
    const lessonsToUpdate = await LessonPlan.find({
      status: "completed",
      recordingUrl: { $exists: false },
      meetingLink: { $exists: true },
    });

    for (const lesson of lessonsToUpdate) {
      const lessonsToUpdate = await LessonPlan.find({
        status: "completed",
        recordingUrl: { $exists: false },
        meetingId: { $exists: true, $ne: null },
      });

      for (const lesson of lessonsToUpdate) {
        const zoomMeetingId = lesson.meetingId;

        if (!zoomMeetingId) {
          console.warn(`Missing meetingId for lesson ${lesson._id}`);
          continue;
        }

        try {
          const files = await getZoomRecordings(zoomMeetingId);
          const mp4 = files.find((f) => f.file_type === "MP4");

          if (mp4?.play_url) {
            lesson.recordingUrl = mp4.play_url;
            lesson.recordingChecked = true;
            await lesson.save();
            console.log(`✅ Recording URL updated for lesson ${lesson._id}`);
          } else {
            console.warn(`⚠️ No MP4 recording found for lesson ${lesson._id}`);
          }
        } catch (err) {
          console.error(
            `❌ Error fetching recordings for lesson ${lesson._id}:`,
            err.message
          );
        }
      }
    }
  } catch (err) {
    console.error("Cron job error:", err.message);
  }
});
