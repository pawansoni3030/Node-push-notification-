# Node-push-notification
to send push notification on devices for testing

Setup Instructions
# 1. Firebase Configuration
Place your firebase.json file in the root directory of the project.
Open => index.js and:
Update => the filename to match your firebase.json if it's different.
Replace the placeholder project_id with the actual project_id from your firebase.json.

#  Device Tokens from Google Sheets (Optional)
This project optionally uses Google Sheets to fetch a list of devices and their respective tokens.

If you'd like to use this method:

* Create a Google Sheet with columns for device and device_token.
* Make sure the sheet is publicly accessible.
* Copy the Sheet ID from the URL (e.g., https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit) and:
* Replace the placeholder Sheet ID in index.html with your actual Sheet ID.
* Update the query in index.html to correctly access your sheet's columns (ensure it matches the column names and structure).
