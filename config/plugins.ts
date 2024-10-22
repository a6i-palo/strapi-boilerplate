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
          const OMIT_PATHS = [
            {
              path: "/content-bundles/{id}",
              methods: ["get", "post", "delete", "put"],
            },
            {
              path: "/content-bundles",
              methods: ["post", "delete", "put"],
            },
            {
              path: "/content-bundles/{id}/localizations",
              methods: ["post", "delete", "put"],
            },
            {
              path: "/question-sets/{id}",
              methods: ["get", "post", "delete", "put"],
            },
            {
              path: "/question-sets",
              methods: ["post", "delete", "put"],
            },
            {
              path: "/question-sets/{id}/localizations",
              methods: ["post", "delete", "put"],
            },
          ];

          OMIT_PATHS.forEach((item) => {
            if (!generatedDocumentationDraft.paths[item.path]) return;

            item.methods.forEach((method) => {
              if (generatedDocumentationDraft.paths[item.path][method]) {
                delete generatedDocumentationDraft.paths[item.path][method];
              }
            });

            if (
              Object.keys(generatedDocumentationDraft.paths[item.path])
                .length === 0
            ) {
              delete generatedDocumentationDraft.paths[item.path];
            }
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
