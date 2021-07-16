// Mongoose is ODM object to document model
// Mongoose provides features like if I want a field to be only in string
// or a particular field can not be null while entering it.
// It makes data manipulation easy, which is usually present in sql
// Using mongoose we interact with mongodb, not directly with the raw apis as are present
// in mongodb folder

const mongoose = require('mongoose')

// connecting not only to mongodb but also to the data base inside it - task-manager-api
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})
