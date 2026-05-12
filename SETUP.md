# BU Training Registration System - Setup Guide

## 1. Firebase Preparation (Spark Plan)

1.  **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/).
2.  **Authentication**:
    *   Go to **Authentication** > **Sign-in method**.
    *   Enable **Google** provider.
    *   Add `bu.ac.th` to Authorized domains (optional, code handles strict domain check).
3.  **Firestore Database**:
    *   Go to **Firestore Database** > **Create database**.
    *   Start in **Production mode**.
    *   Select your region (e.g., `asia-southeast1`).
4.  **Deployment**:
    *   Deploy the provided `firestore.rules` using the Firebase CLI or manually in the console.

## 2. Environment Variables (.env)

Add the following to your deployment environment (e.g., Netlify, Vercel, or AI Studio Secrets):

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Required if using AI features. |
| `VITE_GAS_WEBHOOK_URL` | URL of your Google Apps Script Webhook for email notifications. |

## 3. Google Apps Script (Optional Notification)

If you set up `VITE_GAS_WEBHOOK_URL`, use the following GAS code:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var type = data.type;
  var payload = data.payload;
  
  var adminEmail = "admin@bu.ac.th";
  var userEmail = payload.email || payload.userEmail;
  
  if (type === 'new_registration') {
    MailApp.sendEmail(adminEmail, "New Registration", "User: " + payload.userName + " regisered for " + payload.trainingTitle);
  } else if (type === 'status_update') {
    MailApp.sendEmail(userEmail, "Registration Status Update", "Your registration for " + payload.trainingTitle + " is now " + payload.status);
  }
  
  return ContentService.createTextOutput("Success");
}
```

## 4. Admin Access
The following emails are hardcoded as Admins in `src/lib/firebase.ts`:
*   `panisara.l@bu.ac.th`
*   `admin1@bu.ac.th`
*   `admin2@bu.ac.th`
