// 載入環境變數
require('dotenv').config();

// 載入各種模組
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT;
const mysql = require('mysql2');

// 上傳檔案到 S3 的相關設置
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const s3BucketName = process.env.AWS_S3_BUCKET_NAME;

// 檔案上傳相關設定
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 設置 AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
  
// 連接 RDS
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'public')));


// 設置首頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// 透過 GET 方法取得資料庫內容
app.get('/getMessage', (req, res) => {
    db.query('SELECT id, name, message, file FROM messages', (err, results) => {
        if (err) {
            console.error('數據庫錯誤：', err);
            res.status(500).json({ error: '數據庫錯誤' });
        } else {
            res.json(results);
        };
    });
});

// 透過 POST 方法上傳圖片+文字
app.post('/submit', upload.single('file'), (req, res) => {
    const name = req.body.name;
    const message = req.body.message;
    console.log(name, message);
    const file = req.file;
    const key = 'uploads/' + Date.now() + '-' + file.originalname;
  
    if (!file) {
        return res.status(400).json({ error: '404 NOT FOUND' });
    }

    // 配置 S3 参数
    const params = {
        Bucket: s3BucketName,
        Key: 'uploads/' + Date.now() + '-' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype, // 根據檔案實際格式上傳
    };
  
    // 先判斷圖片，無誤後再上傳到資料庫
    s3.upload(params, (err, data) => {
        if (err) {
            console.error('上傳失敗：', err);
            res.status(500).json({ error: '上傳失敗' });
        } else {
            const file = 'https://d5ygihl98da69.cloudfront.net/uploads/' + path.basename(data.Location)
            console.log('上傳成功：', file);

            db.query(
                'INSERT INTO messages (name, message, file) VALUES (?, ?, ?)',
                [name, message, file],
                (err, results) => {
                    if (err) {
                        console.error('資料庫錯誤：', err);
                        res.status(500).json({ error: '資料庫錯誤' });
                    } else {
                        const newMessage = {
                            id: results.insertId, // 傳回 ID 方便前端生成
                            name,
                            message,
                            file: file,
                        };
                        res.json({ message: '已成功送出留言', newMessage });
                    };
                }
            );
        };
    });
});

// 啟動 Server
app.listen(port, '0.0.0.0',() => {
    console.log(`Server listening at http://54.65.162.207:${port}`);
});