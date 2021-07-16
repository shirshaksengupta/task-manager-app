const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task') 

// Using mongoose middleware
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // mongoose built-in validation that this field can not be null      
        trim: true // remove leading or trailing spaces
    },
    email:{
        type: String, // There are built-in function on schema like String.trim()
        unique: true, // To make sure email is always unique so that no two user has same email id
        required: true, // email has to be provided
        trim: true,
        lowercase: true, // converting the email to lowercase
        validate(value){
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true, // first the password will be trimmed and then length will be calculated
        minlength: 7,
        validate(value){
            if(validator.equals(value, 'password')) { // value.toLowerCase().includes('password')
                throw new Error('Password can not be password')
            }
        }  
    },
    age: {
        type: Number, // Number is a built-in schema type in mongoose
        default: 0, // Default value for age
        validate(value) { // custom validation
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{ // Array of token to store tokens generated for a particular user
        token: {
            type: String,
            required: true
        }
    }],
    avatar: { // Profile picture
        type: Buffer // Storing profile pictures in binary
    }
}, {
    timestamps: true // To track time for creation/updation of user db
})

// Virtual property to link user with tasks
userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
})

// Setting up a value i.e creating a function
// Available on model also known as model methods 
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login !')
    }

    return user
}

// Creating an instance function
// Available on user instance
// Creating authentication token for a user so that he can do other works using this token
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id: user.id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}

// userSchema.methods.getPublicProfile = function () {
//     const user = this
//     const userObject = user.toObject()

//     delete userObject.password
//     delete userObject.tokens

//     return userObject 
// }

userSchema.methods.toJSON = function () { // Works like getPublicProfile
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject 
}

// Want to hash password before saving user data
userSchema.pre('save', async function (next) {
    const user = this

    // True for first time user or when password is being updated
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    // Call this when everything is done so that now it can 
    // save user data
    next()
})

// Delete user task when user is removed
userSchema.pre('remove', async function (next) {
    const user = this

    // Delete multiple task using owner field
    await Task.deleteMany({ owner: user._id})

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User