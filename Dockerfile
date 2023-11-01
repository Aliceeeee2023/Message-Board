FROM node:18.18.2

# 設定工作目錄
WORKDIR /app

# 先複製 package.json
COPY package*.json ./

# 複製所有應用程式文件
COPY . .

# 安裝應用程式的模組
RUN npm install

# 應用程式運行的端口（需與 app.js 相同）
EXPOSE 5000

# 啟動應用程式
CMD ["node", "app.js"]