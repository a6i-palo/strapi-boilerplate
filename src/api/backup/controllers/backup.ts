/**
 * A set of functions called "actions" for `backup`
 */
import { execSync } from "child_process";

export default {
  async export(ctx) {
    try {
      const { artifactoryToken, artifactoryDestination } = ctx.request.body;
      const timestamp = Date.now();

      // console.log(artifactoryToken, artifactoryDestination);

      execSync(`npx strapi export --no-encrypt --file backup/${timestamp}`);

      ctx.status = 204;
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    }
  },
  async import(ctx) {
    try {
      const { fileName, artifactoryDestination, artifactoryToken } =
        ctx.request.body;

      // console.log(artifactoryToken, artifactoryDestination);

      execSync(`npx strapi import --file backup/${fileName} --force`);

      ctx.status = 204;
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    }
  },
};
