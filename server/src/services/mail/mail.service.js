import { sendEmailUsingGmailAPI } from './gmail.mail.service.js';
import { sendEmailWithMailjet } from './mailjet.mail.service.js';
import { sendEmailWithNodeMailer } from './nodemailer.mail.service.js';

export async function sendEmail({ to, subject, html, text }) {
    try {
        if (process.env.NODE_ENV === 'development') {
            const emailResponse = await sendEmailWithNodeMailer({
                to,
                subject,
                html,
                text,
            });
            return emailResponse.message;
        }

        const emailResponse = await sendEmailUsingGmailAPI({
            to,
            subject,
            html,
            text,
        });
        return emailResponse.message;
    } catch (error) {
        try {
            return await sendEmailWithMailjet({ to, subject, html, text });
        } catch (error) {
            console.error('Error sending email: ', error);
            throw error;
            return 'Failed to send email to ' + to;
        }
    }
}
