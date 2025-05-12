const express = require('express')
const app = express()
const {PORT} = require('./utils/config')
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const meetingRouter = require('./routes/meetingRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const paymentRouter = require('./routes/paymentRoutes');

const mongoose = require('mongoose')
const cors = require('cors')

const {MONGODB_URI} =require('./utils/config');
const logger = require('./utils/logger');


mongoose.connect(MONGODB_URI)
const db = mongoose.connection

db.on('error', (errorMessage) => console.log(errorMessage))
db.once('open', () => console.log(`Connected successfully to database`))

app.use(cors())
app.use(express.json())
app.use(logger)
app.use(cookieParser())


app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/meetings', meetingRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/payments', paymentRouter)



app.listen(PORT, console.log(`Server started running at http://localhost:${PORT}/api/v1/`))