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
        packageType,
        collection = null,
        uuids = [],
      } = ctx.request.body;

      const timestamp = Date.now();

      const savefolder = path.join(__dirname, "..", "..", "..", "backup");

      const filename = `${packageName}-${timestamp}-${packageVersion}`;

      if (!fs.existsSync(savefolder)) {
        fs.mkdirSync(savefolder);
      }

      if (packageType === "snapshot") {
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
      }

      if (packageType === "backup" && collection) {
        const tarfile = await BackupServices.backupCollection(
          collection,
          `${savefolder}/${timestamp}`,
          filename,
          uuids,
          packageVersion
        );

        await BackupServices.uploadFileToArtifactory(
          artifactoryUrl,
          artifactoryUsername,
          artifactoryPassword,
          artifactoryDestination,
          `${savefolder}/${timestamp}`,
          tarfile
        );
      }
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
        artifactoryUsername,
        artifactoryPassword,
        artifactoryDestination,
        packageType,
        collection = null,
        filename,
      } = ctx.request.body;

      const savefolder = path.join(__dirname, "..", "..", "..", "backup");

      if (!fs.existsSync(savefolder)) {
        fs.mkdirSync(savefolder);
      }

      BackupServices.downloadFileFromArtifactory(
        artifactoryUrl,
        artifactoryUsername,
        artifactoryPassword,
        artifactoryDestination,
        savefolder,
        filename
      );

      if (packageType === "snapshot") {
        execSync(`npx strapi import --file backup/${filename} --force`);
      }

      if (packageType === "backup" && collection) {
        await strapi.db.transaction(async () => {
          await BackupServices.importCollection(
            collection,
            savefolder,
            filename
          );
        });
      }

      ctx.status = 204;
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    }
  },
};
