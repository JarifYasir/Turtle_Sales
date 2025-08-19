# Google Places API Setup

This application uses Google Places API for address autocomplete functionality in the sale form.

## Setup Instructions

1. **Get a Google Places API Key:**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Places API" for your project
   - Create credentials (API Key)
   - Restrict the API key to specific APIs (Places API) for security

2. **Configure the API Key:**

   - Open the `.env` file in the client directory
   - Replace `your_google_places_api_key_here` with your actual API key:
     ```
     VITE_GOOGLE_PLACES_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

3. **API Key Restrictions (Recommended):**
   - In Google Cloud Console, restrict your API key to:
     - Application restrictions: HTTP referrers (web sites)
     - Add your domain(s): `http://localhost:*`, `https://yourdomain.com/*`
     - API restrictions: Places API

## Features

- **Address Autocomplete**: As users type, Google Places suggests complete addresses
- **Address Formatting**: Selected addresses are automatically formatted in a standardized way
- **US-Only Restriction**: Currently restricted to US addresses (can be modified in `AddressAutocomplete.jsx`)
- **Fallback**: If API key is not configured, the component falls back to a regular text input

## Troubleshooting

- **No suggestions appearing**: Check that your API key is valid and the Places API is enabled
- **Console errors**: Verify the API key in `.env` file and restart the development server
- **Quota exceeded**: Check your Google Cloud Console for API usage and billing

## Cost Considerations

Google Places API has usage-based pricing. For development and small-scale use, the free tier should be sufficient. Monitor your usage in Google Cloud Console.
