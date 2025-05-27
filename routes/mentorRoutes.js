const express = require('express')
const mentorRouter = express.Router()

const { verifyToken, allowRoles } = require('../middlewares/auth')
const { getAllMentors, calculateMentorEarnings } = require('../controllers/mentorController')


mentorRouter.get('/',verifyToken,allowRoles(['admin','student']),getAllMentors)
mentorRouter.get("/earnings", verifyToken, allowRoles(["mentor"]), calculateMentorEarnings);





module.exports = mentorRouter;
