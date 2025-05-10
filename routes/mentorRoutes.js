const express = require('express')
const mentorRouter = express.Router()

const { verifyToken, allowRoles } = require('../middlewares/auth')
const { getAllMentors } = require('../controllers/mentorController')


mentorRouter.get('/',verifyToken,allowRoles(['student']),getAllMentors)



module.exports = mentorRouter;
