const mongoose = require('mongoose')
const validator = require('validator') 

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: { // User who has created it
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Reference to User model; mongoose provides this field for relationship between two models
    }
}, {
    timestamps: true // This option is only available when we use schema
})

const Tasks = mongoose.model('Tasks', taskSchema)

module.exports = Tasks