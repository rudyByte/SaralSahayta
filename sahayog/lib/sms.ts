import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Mock OTP verification store (In production, use Redis or Database)
// Key: phone number, Value: { otp, expiresAt }
// optimization: Using an in-memory Map for MVP. For scale, use Redis.
// In this specific requirement, we are asked to save to `otp_verifications` table in DB.
// So this Map is not needed if we use the DB as requested.

export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
    // Development mode: Log OTP if Twilio credentials are missing
    if (!client) {
        console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        return true;
    }

    try {
        await client.messages.create({
            body: `Your SahayoG verification code is ${otp}. Valid for 10 minutes.`,
            from: fromPhoneNumber,
            to: `+91${phone}`, // Assuming Indian numbers
        });
        return true;
    } catch (error) {
        console.error("Error sending SMS:", error);
        return false;
    }
};
