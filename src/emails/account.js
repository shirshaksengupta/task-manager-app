const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
