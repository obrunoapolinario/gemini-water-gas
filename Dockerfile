FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /usr/src/app
RUN npm install -g prisma
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
COPY . .
RUN pnpm run build
COPY start.sh ./
RUN chmod +x start.sh
EXPOSE 3000
CMD ["./start.sh"]