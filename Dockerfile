FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
COPY start.sh ./
RUN chmod +x start.sh
EXPOSE 3000
CMD ["./start.sh"]