const sgMail = require("@sendgrid/mail");

exports.sendEmail = (subject, email, message) => {
  console.log("process.env.EMAIL", process.env.EMAIL);
  console.log("process.env.SENDGRID_API_KEY", process.env.SENDGRID_API_KEY);

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: process.env.EMAIL,
    subject: subject,
    text: message,
  };

  return sgMail.send(msg);
};
