import {
  Strategy,
  SamlConfig,
  VerifiedCallback,
} from "@node-saml/passport-saml";
import { Strapi } from "@strapi/strapi";

export default ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET"),
    providers: [
      {
        uid: "saml",
        displayName: "SSO Login",
        createStrategy: (strapi: Strapi) => {
          const samlConfig: SamlConfig = {
            acceptedClockSkewMs: -1,
            wantAuthnResponseSigned: false,
            entryPoint: env("SAML_ENTRY_POINT"),
            issuer: env("SAML_ISSUER"),
            idpCert: env("SAML_CERT"),
            callbackUrl: `http://localhost:1337${strapi.admin.services.passport.getStrategyCallbackURL(
              "saml"
            )}`,
          };

          return new Strategy(
            samlConfig,
            async (profile: any, done: VerifiedCallback) => {
              const editorRole = await strapi.db
                .query("admin::role")
                .findOne({ where: { name: "Editor" } });
              console.log(editorRole);

              const users = await strapi.db.query("admin::user").findMany();
              console.log(users);

              done(null, {
                username:
                  profile?.attributes["http://schemas.auth0.com/nickname"],
                email:
                  profile?.attributes[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                  ],
              });
            },
            (profile, done: VerifiedCallback) => {
              done(null, profile);
            }
          );
        },
      },
    ],
    events: {
      async onConnectionSuccess(e) {
        // await console.log("onConnectionSuccess", e.user);
        // const editorRole = await strapi.db
        //   .query("admin::role")
        //   .findOne({ where: { name: "Editor" } });
        // console.log(editorRole);
        // const users = await strapi.db.query("admin::user").findMany();
        // console.log(users);
        // const updatedUser = await strapi.entityService.update(
        //   "plugin::users-permissions.user",
        //   e.user.id,
        //   {
        //     data: {
        //       role: editorRole.id,
        //     },
        //   }
        // );
        // console.log(updatedUser);
      },
    },
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
