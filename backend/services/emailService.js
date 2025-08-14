// backend/services/emailService.js
/* const nodemailer = require('nodemailer');

let transporter;

// lazy-initialize your SMTP transport once
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   +process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * Send a confirmation email after a user submits a response.
 * @param {string} to        recipient email address
 * @param {{eventId:number,submissionId:number}} info
 */
/*exports.sendResponseEmail = async function sendResponseEmail(to, { eventId, submissionId }) {
  const transporter = getTransporter();

  const message = {
    from:    process.env.SMTP_FROM,        // e.g. '"Event Dashboard" <no-reply@you.com>'
    to,
    subject: `Your submission #${submissionId} for event ${eventId}`,
    text: `
      Thank you for your submission!
      Submission ID: ${submissionId}
      You can view or edit your response here:
      ${process.env.APP_URL}/events/${eventId}/responses/${submissionId}
    `.replace(/^\s+/gm, ''),
    html: `
      <p>Thank you for your submission!</p>
      <ul>
        <li><strong>Submission ID:</strong> ${submissionId}</li>
        <li><a href="${process.env.APP_URL}/events/${eventId}/responses/${submissionId}">
          View/Edit your response
        </a></li>
      </ul>
    `
  };

  await transporter.sendMail(message);
};
*/

// services/emailService.js
const nodemailer = require('nodemailer');

let transporter = null;
if (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn('⚠️  SMTP not configured—emails will be skipped');
}

exports.sendResponseEmail = async (to, { eventId, submissionId }) => {
  if (!transporter) {
    // no-op
    console.log(`✉️  Skipped email to ${to} for event ${eventId}/${submissionId}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Thanks for your response! (#${submissionId})`,
    text: `Your response to event ${eventId} was recorded. View it at ${process.env.APP_URL}/events/${eventId}/responses/${submissionId}`,
    html: `<p>Your response to event <strong>${eventId}</strong> was recorded.</p>
           <p><a href="${process.env.APP_URL}/events/${eventId}/responses/${submissionId}">
             View or edit your submission
           </a></p>`,
  });
};
