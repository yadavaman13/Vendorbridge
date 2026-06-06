import { sendEmailUsingGmailAPI } from './gmail.mail.service.js';
import { sendEmailWithMailjet } from './mailjet.mail.service.js';
import { sendEmailWithNodeMailer } from './nodemailer.mail.service.js';

export async function sendEmail({ to, subject, html, text, attachments }) {
    let targetEmail = to;
    if (typeof targetEmail === 'string' && (targetEmail.endsWith('.local') || !targetEmail.includes('@'))) {
        console.warn(`Redirecting local/invalid recipient email ${targetEmail} to test email: work.yadavaman@gmail.com`);
        targetEmail = 'work.yadavaman@gmail.com';
    }

    try {
        if (process.env.NODE_ENV === 'development') {
            const emailResponse = await sendEmailWithNodeMailer({
                to: targetEmail,
                subject,
                html,
                text,
                attachments,
            });
            return emailResponse.message;
        }

        const emailResponse = await sendEmailUsingGmailAPI({
            to: targetEmail,
            subject,
            html,
            text,
            attachments,
        });
        return emailResponse.message;
    } catch (error) {
        try {
            return await sendEmailWithMailjet({ to: targetEmail, subject, html, text, attachments });
        } catch (error) {
            console.error('Error sending email: ', error);
            throw error;
            return 'Failed to send email to ' + targetEmail;
        }
    }
}
