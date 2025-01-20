const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "safianusani2004@gmail.com",
    pass: "yegd jcgd bxeu rsvz",
  },
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: "safianusani2004@gmail.com",
    to: to,
    subject: subject,
    html: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error occurred: " + error.message);
    }
    console.log("Email sent: " + info.response);
  });
};

module.exports = {
  sendEmail,
};
