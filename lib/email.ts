import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export async function sendVerificationEmail(email: string, otp: string) {
    // If credentials are missing, log to console for development
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('====================================================')
        console.log(`[DEV MODE] Email to ${email}`)
        console.log(`[DEV MODE] OTP: ${otp}`)
        console.log('====================================================')
        return
    }

    const html = `
    <div style="font-family: sans-serif; color: #000; max-width: 400px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">Verify your PriceLens email</h1>
      <p style="margin-bottom: 20px; color: #333;">Enter the following code to verify your account:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 2px; margin-bottom: 20px; text-align: center; border: 1px solid #000; padding: 10px;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #666;">This code expires in 10 minutes.</p>
    </div>
  `

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your PriceLens email',
        html,
    })
}
