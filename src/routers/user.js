const express = require('express')
const multer = require('multer')
const sharp = require('sharp') // Module for editing images
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')

const router = new express.Router()

// Directory to hold user images
const upload = multer({
    // Required to comment dest, else multer will always store the pics in this folder
    //dest: 'avatars', // This will also create avatar directory in the folder from where index.js is run
    limits: {
        fileSize: 1000000 // Size in bytes 1MB
    },
    fileFilter(req, file, cb) { // cb - callback
        //if (!file.originalname.endsWith('pdf')) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) { // Using regex to understand the file extension (regex101.com)
            return cb(new Error('Upload a jpg, jpeg or png document'))
        }
        cb(undefined, true) // Accept the given upload
    }
})

// Route for signup
// No requirement of user authentication
router.post('/users', async (req, res) => { // Sign up route
    const user = new User(req.body) // The incoming message matches that of the User model

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)

        // Generate and send authentication token
        // Creating jwt token
        // Client can make use of this token to make other requests
        const token = await user.generateAuthToken()

        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

// Route for Logging in
// No requirement of user authentication
router.post('/users/login', async (req, res) => {
    try { // Validating credentials
        const user = await User.findByCredentials(req.body.email, req.body.password) // Self created function

        // Creating jwt token
        // Client can make use of this token to make other requests
        const token = await user.generateAuthToken()

        // res.send({user: user.getPublicProfile(),token})
        res.send({user,token}) // It calls JSON.stringify() and before this .toJSON is called automatically
    } catch (e) {
        res.status(400).send()
    }
})

// Logout from one session
router.post('/users/logout', auth, async (req, res) => {
    // Target only specific token as each token could be from different device

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token // Remove the matched token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Logout from all sessions 
router.post('/users/logoutall', auth, async (req, res) => {
    // Target only specific token as each token could be from different device

    try {
            req.user.tokens = []
            await req.user.save()
            res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// First middleware auth will run and then the route handler if the
// middleware calls the next()
router.get('/users/me', auth, async (req, res) => { 
  res.send(req.user)
})

// update
// Any properites which are not present for user for eg height, will be ignored by default
// Mongoose ignores it.
router.patch ('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body) // Will return array of strings
    const allowedUpdates = ['name', 'email', 'password', 'age'] // Valid properties to modify

    // updates should consists of only allowedUpdates
    // Taking care of default mongoose property of not caring for properties which are not present
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update) 
    })

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        // To use middleware
        // A few of the queries like update bypasses middleware
        // console.log(req.user)
        updates.forEach((update) => req.user[update] = req.body[update])

        await req.user.save()
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }
})

// Upload profile pic
// router.post('/users/me/avatar', upload.single('avatar'), (req, res) => {
//     res.send()
// }, (error, req, res, next) => { // Express error handling
//     res.status(400).send({error: error.message})
// })

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // Multer can access image/form data not req
    // req.user.avatar = req.file.buffer

    // Convert image to png, resize it to 250x250
    const buffer = await sharp(req.file.buffer).resize({ width:250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send() // Success message
}, (error, req, res, next) => { // Express error handling
    res.status(400).send({error: error.message})
})

// Delete user profile pic
router.delete('/users/me/avatar', auth, async (req,res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

// This get is for browsers to get the image if they have the id of the user
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error('User or avatar not available')
        }
        res.set('Content-Type', 'image/png') // Need to tell user extension of the avatar - pdf, jpg, jpeg
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove() // Has a pre associated in user models
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router