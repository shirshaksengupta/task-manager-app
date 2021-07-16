const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {

    // console.log('Auth middleware')
    // next()

    try {
        // Check postman get users Header
        const token = req.header('Authorization').replace('Bearer ', '') // Getting the token from req Header 
        // console.log(token)

        const decoded = jwt.verify(token, process.env.JWT_SECRET) // Verify this token using secret present in models
        // console.log(decoded)
        // Embedded user id in token
        // Looking if the user has this authentication token stored.
        // console.log(decoded._id)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        if(!user) {
            throw new Error()
        }

        req.token = token
        req.user = user // Route handler does not have to figure out the user again
        next()

    } catch (e) {
        res.status(401).send({error: 'Please authenticate'})
    }

}

module.exports = auth