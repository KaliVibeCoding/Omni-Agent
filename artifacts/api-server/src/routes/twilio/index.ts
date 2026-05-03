import { Router } from "express";
import twilio from "twilio";
import {
  SendTwilioSmsBody,
  MakeTwilioCallBody,
  GetTwilioVoiceTokenBody,
  TwilioLookupBody,
} from "@workspace/api-zod";

const router = Router();

function getTwilioClient() {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const apiKeySid = process.env["TWILIO_API_KEY_SID"];
  const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];

  if (!accountSid) {
    throw new Error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID.");
  }

  // Use Auth Token (most reliable); fall back to API Key auth
  if (authToken) {
    return twilio(accountSid, authToken);
  }
  if (apiKeySid && apiKeySecret) {
    return twilio(apiKeySid, apiKeySecret, { accountSid });
  }
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET.");
}

router.get("/account", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const accountSid = process.env["TWILIO_ACCOUNT_SID"]!;
    const account = await client.api.v2010.accounts(accountSid).fetch();
    const balance = await client.balance.fetch();
    res.json({
      sid: account.sid,
      friendlyName: account.friendlyName,
      status: account.status,
      balance: balance.balance,
      currency: balance.currency,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/phone-numbers", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const numbers = await client.incomingPhoneNumbers.list({ limit: 50 });
    res.json(numbers.map((n) => ({
      sid: n.sid,
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      capabilities: {
        voice: n.capabilities.voice ?? false,
        sms: n.capabilities.sms ?? false,
        mms: n.capabilities.mms ?? false,
      },
    })));
  } catch (err) {
    next(err);
  }
});

router.post("/send-sms", async (req, res, next) => {
  try {
    const { to, from, body } = SendTwilioSmsBody.parse(req.body);
    const client = getTwilioClient();
    const msg = await client.messages.create({ to, from, body });
    res.json({ sid: msg.sid, status: msg.status, to: msg.to, from: msg.from, body: msg.body });
  } catch (err) {
    next(err);
  }
});

router.post("/make-call", async (req, res, next) => {
  try {
    const { to, from, twiml } = MakeTwilioCallBody.parse(req.body);
    const client = getTwilioClient();
    const call = await client.calls.create({ to, from, twiml });
    res.json({ sid: call.sid, status: call.status, to: call.to, from: call.from });
  } catch (err) {
    next(err);
  }
});

router.post("/voice-token", async (req, res, next) => {
  try {
    const { identity } = GetTwilioVoiceTokenBody.parse(req.body);
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const apiKeySid = process.env["TWILIO_API_KEY_SID"];
    const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];

    if (!accountSid || !apiKeySid || !apiKeySecret) {
      res.status(500).json({ error: "Twilio credentials not configured" });
      return;
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({ incomingAllow: true });
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity,
      ttl: 3600,
    });
    token.addGrant(voiceGrant);

    res.json({ token: token.toJwt(), identity, ttl: 3600 });
  } catch (err) {
    next(err);
  }
});

router.post("/lookup", async (req, res, next) => {
  try {
    const { phoneNumber, fields } = TwilioLookupBody.parse(req.body);
    const client = getTwilioClient();

    const fetchOptions: Record<string, unknown> = {};
    if (fields && fields.length > 0) {
      fetchOptions["fields"] = fields.join(",");
    }

    const result = await (client.lookups.v2.phoneNumbers(phoneNumber) as any).fetch(fetchOptions);

    res.json({
      phoneNumber: result.phoneNumber,
      nationalFormat: result.nationalFormat,
      countryCode: result.countryCode,
      valid: result.valid,
      lineTypeIntelligence: result.lineTypeIntelligence ?? null,
      callerName: result.callerName ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
