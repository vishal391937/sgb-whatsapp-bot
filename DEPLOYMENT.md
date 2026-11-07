# SGB Agro WhatsApp Bot - Production Deployment

## 1. Environment Variables Needed
Configure these in your hosting environment (Railway, Render, VPS, etc.):

- `PORT`: `3000` (or assigned by host)
- `WHATSAPP_PHONE_NUMBER_ID`: From Meta Developer Console
- `WHATSAPP_ACCESS_TOKEN`: System User Token from Meta
- `WHATSAPP_VERIFY_TOKEN`: Your custom secret token (e.g. `sgb_agro_verify_key_2026`)
- `GEMINI_API_KEY`: Your Google AI Studio API key
- `GOOGLE_SHEET_ID`: (Optional) Google Spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: (Optional) GCP Service Account Email
- `GOOGLE_PRIVATE_KEY`: (Optional) GCP Service Account Private Key

## 2. Meta WhatsApp Cloud API Setup
1. Go to [developers.facebook.com](https://developers.facebook.com).
2. Create an App -> Type: **Business** -> Add product: **WhatsApp**.
3. Under **WhatsApp -> Configuration**:
   - **Callback URL**: `https://<YOUR_DEPLOYED_DOMAIN>/webhook`
   - **Verify Token**: Must match `WHATSAPP_VERIFY_TOKEN` in your `.env`.
   - Webhook field subscription: Check **`messages`**.
4. Under **WhatsApp -> API Setup**:
   - Copy the **Phone Number ID**.
   - Generate a permanent System User Token under Business Settings -> System Users with permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`

## 3. Social Media Ad Link Setup (Click-to-WhatsApp)
In Facebook Ads Manager or Instagram Ads:
- **Campaign Objective**: Engagement or Traffic -> Messenger & WhatsApp.
- **WhatsApp Destination**: Connect your official SGB Agro WhatsApp number.
- **Default Customer Message**:
  `Hi, I saw your ad on social media and would like to know more about SGB Agro agricultural machines.`

