import FormData from 'form-data';
import fetch from 'node-fetch';

export async function sendEmail(userData: any) {
  const form = new FormData();
  form.append('from', `FIM Bot <${userData.gmail}>`);
  form.append('to', process.env.RECIPIENT_EMAIL!);
  form.append('subject', 'New Transaction Alert');
  form.append('text', `
    Name: ${userData.name}
    WhatsApp: ${userData.whatsapp}
    Gmail: ${userData.gmail}
    Cryptocurrency: ${userData.crypto}
    Plan: ${userData.amount}₹
    Wallet Address: ${userData.wallet}
    UPI ID: ${userData.upi}
    Transaction ID: ${userData.transaction_id}
  `);

  try {
    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
      },
      body: form,
    });

    if (response.ok) {
      console.log('Email sent successfully');
    } else {
      console.error('Error sending email:', await response.text());
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

