import { Strategy } from "@node-saml/passport-saml";

export default ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET"),
    providers: [
      {
        uid: "saml",
        displayName: "SAML",
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/320px-Microsoft_logo_%282012%29.svg.png",
        createStrategy: (strapi) => {
          return new Strategy(
            {
              wantAuthnResponseSigned: false,
              entryPoint: env("SAML_ENTRY_POINT"),
              issuer: env("SAML_ISSUER"),
              idpCert: env("SAML_CERT"),
              callbackUrl: `http://localhost:1337${strapi.admin.services.passport.getStrategyCallbackURL(
                "saml"
              )}`,
            },
            (profile: any, done: any) => {
              done(null, {
                email:
                  profile?.attributes[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                  ],
              });
            },
            (profile, done: any) => {
              done(null, profile as any);
            }
          );
        },
      },
    ],
  },
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT"),
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
  watchIgnoreFiles: ["**/config/sync/**"],
});
