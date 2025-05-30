const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

// --- Configuration ---
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'firebase.json'); // Replace with your Firebase.json
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const FCM_PROJECT_ID = 'project_id'; // Replace with your Firebase Project ID
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Authentication Function ---
async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: [FCM_SCOPE],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// --- Push Notification Sending Function ---
async function sendPushNotification(deviceToken, title, body, customData = {}, sound = "default", imageUrl = null) {
  if (!deviceToken) {
    throw new Error("Device token is required to send a push notification.");
  }

  const accessToken = await getAccessToken();

  const message = {
    message: {
      token: deviceToken,
      notification: {
        title: title || "Notification By Node 🤖",
        body: body || "You have a new message.",
      },
      data: {
        custom: customData ? JSON.stringify(customData) : '{}',
        ...(sound === "silent" ? {} : { sound }),
        title: title || "Notification By Node 🤖",
        body: body || "You have a new message.",
      },
    },
  };

  // Add platform-specific configurations
  // APNs (iOS) configuration
    message.message.apns = {
      ...(sound === "silent" ? { headers: { "apns-priority": "5" } } : {}), //  apns-priority 5 silent
      payload: {
        aps: {
          alert: {
            title: title || "Notification By Node 🤖",
            body: body || "You have a new message.",
          },
          ...(sound === "silent" ? {} : { sound }),
          ...(sound === "silent" ? { "content-available": 1 } : {}),
          // "mutable-content": 1,
        },
      },
      ...(imageUrl && { fcm_options: {
        // Add image URL to notification payload if available
        image: imageUrl
      } }),
    };
  // Android configuration
  if (sound !== "default" && sound !== "silent" && deviceToken.startsWith('e')) { // Simple heuristic for Android token
    const androidSound = sound.split('.')[0]; // Get filename without extension
    message.message.android = {
      notification: {
        sound: androidSound,
        ...(imageUrl && {imageUrl: imageUrl})
      }
    };
  } else if (deviceToken.startsWith('e')) { // For default/silent on Android
    message.message.android = {
      notification: {
        sound: sound,
        ...(imageUrl && {imageUrl: imageUrl})
      }
    };
  }

  console.log('Sending FCM message:', JSON.stringify(message, null, 2));

  const response = await axios.post(FCM_ENDPOINT, message, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

// --- API Endpoint ---
app.post('/send-push', async (req, res) => {
  try {
    // Extract imageUrl from the request body
    const { token, title, body, customData, sound, imageUrl } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: "Device token is required." });
    }

    // Pass imageUrl to the push notification function
    const result = await sendPushNotification(token, title, body, customData, sound, imageUrl);
    res.status(200).json({ success: true, message: "Push notification sent successfully!", result });
  } catch (error) {
    console.error('FCM Push Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser to send pushes.`);
});