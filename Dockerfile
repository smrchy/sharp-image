FROM node:14.15.4-alpine as builder

RUN mkdir /src
WORKDIR /src
ADD ./package.json /src/package.json
RUN npm install
COPY app /src/app
COPY tsconfig.json /src/tsconfig.json
RUN npm run build
RUN rm -rf node_modules && npm install --production

FROM node:14.15.4-alpine
RUN addgroup -S appuser \
    && adduser -S -G appuser appuser \
    && mkdir /src \
    && chown appuser:appuser /src
USER appuser
WORKDIR /src

COPY --from=builder /src/node_modules /src/node_modules
COPY --from=builder /src/package.json /src/package.json
COPY --from=builder /src/app/*.js /src/app/
ENV TZ=Zulu
EXPOSE 3000
CMD ["node", "/src/app/app.js", "--max-old-space-size=128"]
