FROM node:20-alpine3.20 as build
# RUN apt-get update && apt-get install libvips-dev -y

# ARG NODE_ENV=development
# ENV NODE_ENV=${NODE_ENV}
# ARG STRAPI_LICENSE
# ENV STRAPI_LICENSE=${STRAPI_LICENSE}


WORKDIR /opt/
COPY ./package.json ./package-lock.json ./
ENV PATH /opt/node_modules/.bin:$PATH
RUN npm ci

WORKDIR /opt/app
COPY ./ .
RUN npm run build

RUN npm prune --omit-dev

FROM node:20-alpine3.20
# Installing libvips-dev for sharp Compatability
# RUN apt-get update && apt-get install libvips-dev -y

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
# ARG STRAPI_LICENSE
# ENV STRAPI_LICENSE=${STRAPI_LICENSE}

WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules

WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH /opt/node_modules/.bin:$PATH

RUN chown -R node:node /opt/app
USER node

EXPOSE 1337
CMD ["npm", "run", "start"]
