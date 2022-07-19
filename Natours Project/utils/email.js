// Import Nodemailer
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    // Using Mailtrap, get the info from env file.
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // Define the email options
  const mailOptions = {
    from: 'Murat Altun <mraltun@mraltun.poe>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // Actually send the email
  await transporter.sendMail(mailOptions);
};

// Export Default
module.exports = sendEmail;
