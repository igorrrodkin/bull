# base image
FROM node:16 as build

ENV YARN_CACHE_FOLDER=/usr/local/yarn-cache
VOLUME /usr/local/yarn-cache

WORKDIR /app
COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:16-alpine

COPY --from=build /app/build build
COPY --from=build /app/.env .env
COPY --from=build /app/drizzle drizzle

CMD ["node", "build"]