const express = require('express');
const userRouter = express.Router();

const { verifyToken , allowRoles } = require('../middlewares/auth');
const { updateProfile, getAllUsers, deleteUserById } = require('../controllers/userController');
const uploadDocuments = require('../middlewares/uploadDocuments');
const { submitMentorRequest, getMentorRequest, updateMentorRequestStatus } = require('../controllers/mentorRequestController');


userRouter.put('/updateProfile',verifyToken,uploadDocuments.single('profilePicture'),updateProfile)

//Mentor Request 
userRouter.post('/mentorRequest',verifyToken,uploadDocuments.array('documents',3),submitMentorRequest)

// admin routes
userRouter.get('/', verifyToken, allowRoles(['admin']), getAllUsers)
userRouter.get('/mentorRequest',verifyToken,allowRoles(['admin']),getMentorRequest)
userRouter.patch('/mentorRequestUpdate/:id',verifyToken,allowRoles(['admin']),updateMentorRequestStatus)
userRouter.delete('/:id', verifyToken, allowRoles(['admin']), deleteUserById)


module.exports=userRouter 