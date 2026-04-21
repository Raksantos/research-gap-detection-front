FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./

FROM base AS deps
RUN corepack yarn install --immutable

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["corepack", "yarn", "dev"]

FROM deps AS builder
COPY . .
RUN corepack yarn build

FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
