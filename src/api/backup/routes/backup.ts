export default {
  routes: [
    {
      method: "POST",
      path: "/backup/export",
      handler: "backup.export",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/backup/import",
      handler: "backup.import",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
