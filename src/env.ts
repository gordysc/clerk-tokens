import { defineEnvVars } from "@sveltejs/kit/env";

// All optional: consumers apply defaults or raise a descriptive error when a value is missing.
const optional = (input: string | undefined) => input;

export const variables = defineEnvVars({
  CLERK_AZP_ORIGIN: {
    description:
      "Origin for the `azp` claim. Defaults to `http://localhost:5173`.",
    schema: optional
  },
  CLERK_SECRET_KEY: {
    description: "Clerk secret key for the Backend API.",
    schema: optional
  },
  CLERK_JWT_TEMPLATE: {
    description: "JWT template name. Defaults to `default`.",
    schema: optional
  }
});
