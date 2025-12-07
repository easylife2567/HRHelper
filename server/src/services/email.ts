import nodemailer = require('nodemailer');

const MAIL_ACCOUNT = process.env.MAIL_ACCOUNT;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;

const transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true, // true for 465
    auth: {
        user: MAIL_ACCOUNT,
        pass: MAIL_PASSWORD
    }
});

export class EmailService {
    static async sendEmail(to: string, subject: string, content: string) {
        if (!MAIL_ACCOUNT || !MAIL_PASSWORD) {
            console.warn('Email config missing');
            return;
        }

        try {
            const info = await transporter.sendMail({
                from: `"HR Helper" <${MAIL_ACCOUNT}>`,
                to,
                subject,
                text: content, // Plain text
                // html: content // If using HTML
            });
            console.log('Message sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Email send failed:', error);
            throw error;
        }
    }
}
