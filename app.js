const express = require('express')
const app = express()
const {PORT} = require('./utils/config')
const cookieParser = require('cookie-parser');
const { generalLimiter, authLimiter } = require('./middlewares/rateLimiter');

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const meetingRouter = require('./routes/meetingRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const LessonRouter = require('./routes/lessonRoutes');
const courseRouter=require('./routes/courseRoutes')

const mongoose = require('mongoose')
const cors = require('cors')

const {MONGODB_URI} =require('./utils/config');
const {FRONTEND_URL} = require('./utils/config');
const logger = require('./utils/logger');
const mentorRouter = require('./routes/mentorRoutes');



mongoose.connect(MONGODB_URI)
const db = mongoose.connection

db.on('error', (errorMessage) => console.log(errorMessage))
db.once('open', () => console.log(`Connected successfully to database`))

const corsOptions = {
  origin:[
    'https://learning-platform-fe-coral.vercel.app',
    'http://localhost:5173' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};


require("./utils/lessonCron")

app.use(cors(corsOptions))
app.use(express.json())
app.use(logger)
app.use(cookieParser())


app.use('/api/v1/uploads', express.static('uploads'));


app.use('/api/v1/auth', authRouter,authLimiter);
app.use('/api/v1/users', userRouter,generalLimiter);
app.use('/api/v1/meetings', meetingRouter,generalLimiter)
app.use('/api/v1/reviews', reviewRouter,generalLimiter)
app.use('/api/v1/payments', paymentRouter,generalLimiter)
app.use('/api/v1/mentors',mentorRouter,generalLimiter)
app.use('/api/v1/lessons', LessonRouter,generalLimiter)
app.use('/api/v1/courses', courseRouter,generalLimiter)



app.listen(PORT, console.log(`Server started running at http://localhost:${PORT}/api/v1/`))