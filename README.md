# GHL Smartbuild App
Environment Variables:
_ `PORT`: The port to run the app on. Default 3000. You also need to set the port in the Dockerfile.
- `GHL_CLIENT_ID`: Your GoHighLevel Client ID.
- `GHL_CLIENT_SECRET`: Your GoHighLevel Client Secret.
- `GHL_SCOPES`: Your GoHighLevel Scopes.
- `GCP_PROJECT_ID`: Your Google Cloud Project ID.
- `GHL_BASE_URL`: The base URL for the GoHighLevel API.
- `GHL_DEFAULT_API_VERSION`: The default API version for the GoHighLevel API.
- `REDIRECT_URI`: The OAuth redirect URI for the GoHighLevel API.
- `SMARTBUILD_BASE_URL`: The base URL for the Smartbuild API.

## Example Environment Variables
PORT=3000
GHL_CLIENT_ID=<YOUR_GHL_CLIENT_ID>
GHL_CLIENT_SECRET=<YOUR_GHL_CLIENT_SECRET>
GHL_SCOPES=contacts.write opportunities.write opportunities.readonly contacts.readonly locations.write locations.readonly users.readonly oauth.write oauth.readonly workflows.readonly locations/customFields.write locations/customFields.readonly
GCP_PROJECT_ID=<YOUR_GCP_PROJECT_ID>
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_DEFAULT_API_VERSION=2021-07-28
REDIRECT_URI=<YOUR_DOMAIN_OR_LOCALHOST>/auth/callback
SMARTBUILD_BASE_URL=https://postframesolver.azurewebsites.net