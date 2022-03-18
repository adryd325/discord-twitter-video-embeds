FROM node:16-bullseye

RUN apt-get update
RUN apt-get install -y ffmpeg git sudo gcc g++ make
RUN npm install -g pnpm

RUN mkdir -p /bot
WORKDIR /bot

# Add just what's necessary to install modules first, for caching purposes
COPY package.json /bot/package.json
COPY pnpm-lock.yaml /bot/pnpm-lock.yaml
RUN pnpm i -C /bot

ADD . /bot

CMD bash -l -c "node index.js"
