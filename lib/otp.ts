import bcrypt from 'bcryptjs'

export async function generateOtp() {
    // Generate a 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    return otp
}

export async function hashOtp(otp: string) {
    return await bcrypt.hash(otp, 10)
}

export async function verifyOtpHash(otp: string, hash: string) {
    return await bcrypt.compare(otp, hash)
}
