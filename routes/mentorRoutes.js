const express = require('express')
const mentorRouter = express.Router()

const { verifyToken, allowRoles } = require('../middlewares/auth')
const { getAllMentors } = require('../controllers/mentorController')


mentorRouter.get('/',verifyToken,allowRoles(['admin','student']),getAllMentors)





module.exports = mentorRouter;
