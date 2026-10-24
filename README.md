# Clerk Tokens

This SvelteKit app is a simple utility for testing Clerk authentication in local dev environments. The intent of the portal is to allow you to generate bearer tokens that you can use to test against the API.

## Setup

1. Copy the env template and fill in your Clerk secret key (Clerk Dashboard → Configure → API keys → Secret keys):

   ```sh
   cp .env.example .env
   ```

2. Make sure your Clerk instance has a JWT template named `default` (Clerk Dashboard → Configure → JWT templates). A different template can be used by setting `CLERK_JWT_TEMPLATE` in `.env`.

   Tokens are minted through the Clerk Frontend API (dev instances only) so they carry an `azp` (authorized party) claim — `azp` is reserved and cannot be added via JWT templates. Set `CLERK_AZP_ORIGIN` in `.env` to the origin your API expects (defaults to `http://localhost:5173`).

3. Install and run:

   ```sh
   pnpm install
   pnpm dev
   ```

## Usage

Pick a user from the dropdown and hit **Generate bearer token**. The minted JWT is shown with a live expiry countdown and its decoded claims; copy it raw or as a ready-to-paste `Authorization: Bearer …` header.

> [!NOTE]
> Generating a token signs the user in for real (sign-in token → Frontend API ticket exchange), creating a session. Revoke stray sessions from the Clerk dashboard if needed.
