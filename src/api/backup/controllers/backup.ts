/**
 * A set of functions called "actions" for `backup`
 */
import { execSync } from "child_process";
import BackupServices from "../services/backup";
const path = require("path");
const fs = require("fs");

export default {
  async export(ctx) {
    try {
      const {
        artifactoryUrl,
        artifactoryUsername,
        artifactoryPassword,
        artifactoryDestination,
        packageVersion,
        packageName,
      } = ctx.request.body;

      const timestamp = Date.now();

      const savefolder = path.join(__dirname, "..", "..", "..", "backup");

      const filename = `${packageName}-${timestamp}-${packageVersion}`;

      if (!fs.existsSync(savefolder)) {
        fs.mkdirSync(savefolder);
      }

      execSync(
        `npx strapi export --no-encrypt --file ${savefolder}/${filename}`
      );

      await BackupServices.uploadFileToArtifactory(
        artifactoryUrl,
        artifactoryUsername,
        artifactoryPassword,
        artifactoryDestination,
        savefolder,
        `${filename}.tar.gz`
      );

      ctx.status = 204;
    } catch (err) {
      console.log(err);
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    }
  },
  async import(ctx) {
    try {
      const {
        artifactoryUrl,
        filename,
        artifactoryDestination,
        artifactoryUsername,
        artifactoryPassword,
      } = ctx.request.body;

      const savefolder = path.join(__dirname, "..", "..", "..", "backup");

      BackupServices.downloadFileFromArtifactory(
        artifactoryUrl,
        artifactoryUsername,
        artifactoryPassword,
        artifactoryDestination,
        savefolder,
        filename
      );

      execSync(`npx strapi import --file backup/${filename} --force`);

      ctx.status = 204;
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    }
  },
};
