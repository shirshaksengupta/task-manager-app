const sgMail = require('@sendgrid/mail')

// const sengridAPIKey = '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'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// sgMail.setApiKey(sengridAPIKey)

// sgMail.send({
//     to: 'sgshirshak@gmail.com',
//     from: 'sgshirshak@gmail.com',
//     subject: 'This is my first creation',
//     text: 'Sending email using sendgrid'
// })

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sgshirshak@gmail.com',
        subject: 'Welcome to task manager app',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sgshirshak@gmail.com',
        subject: 'Cancellation confirmation from Task manager app',
        text: `Hi ${name}, we hope you had a good time using our app. Let us know what we could have done to keep 
        you onboard`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}
