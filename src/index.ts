const generatePassword = () => {
  const length = 12,
    charset =
      "@#&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&*0123456789abcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const seedAdmins = String(process.env.SEED_ADMINS);

    if (seedAdmins == "undefined" || seedAdmins == "") return;

    seedAdmins.split(",").forEach(async (email) => {
      const adminPassword = generatePassword();

      const superAdminRole = await strapi.db
        .query("admin::role")
        .findOne({ where: { code: "strapi-super-admin" } });

      const superAdmin = await strapi.db
        .query("admin::user")
        .findOne({ where: { email: email } });

      if (!superAdmin) {
        const params = {
          username: email,
          email: email,
          password: await strapi.admin.services.auth.hashPassword(
            adminPassword
          ),
          blocked: false,
          isActive: true,
          confirmed: true,
          roles: [superAdminRole],
        };

        await strapi.db.query("admin::user").create({
          data: { ...params },
          populate: ["roles"],
        });

        console.log(
          `\nAdmin account created for ${email} with temporary password: ${adminPassword}. Please update the password after logging in`
        );
      }
    });
  },
};
