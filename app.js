const express = require('express')
const app = express()
const {PORT} = require('./utils/config')

const authRouter = require('./routes/authRoutes');

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


app.use('/api/v1/auth', authRouter);



app.listen(PORT, console.log(`Server started running at http://localhost:${PORT}/api/v1/`))