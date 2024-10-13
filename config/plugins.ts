export default () => ({
  documentation: {
    enabled: true,
    config: {
      openapi: "3.0.0",
      info: {
        version: "1.0.0",
        title: "OpenAPI Specs",
        description: "Strapi CMS API Documentation",
        contact: {
          name: "Ang Ziwei",
          email: "zang@palo-it.com",
          url: "https://www.strapi.io",
        },
        license: {
          name: "Apache 2.0",
          url: "https://www.apache.org/licenses/LICENSE-2.0.html",
        },
      },
      "x-strapi-config": {
        // Leave empty to ignore plugins during generation
        plugins: [],
        path: "/documentation",
        mutateDocumentation: (generatedDocumentationDraft) => {
          const pathsToDelete = [
            "/content-bundles/{id}",
            "/content-bundles",
            "/content-bundles/{id}/localizations",
            "/question-sets/{id}",
            "/question-sets",
            "/question-sets/{id}/localizations",
          ];

          const methodsToDelete = ["post", "delete", "put"];

          pathsToDelete.forEach((basePath) => {
            methodsToDelete.forEach((method) => {
              if (
                generatedDocumentationDraft.paths[basePath] &&
                generatedDocumentationDraft.paths[basePath][method]
              ) {
                delete generatedDocumentationDraft.paths[basePath][method];
              }
            });
          });
        },
      },
      servers: [
        { url: "http://localhost:1337/api", description: "Development server" },
      ],
      security: [{ bearerAuth: [] }],
    },
  },
});
