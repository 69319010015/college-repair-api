const config = require('./config');
const createApp = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[${config.env}] college-repair-api listening on http://localhost:${config.port}`);
});

// ปิดอย่างสุภาพเมื่อ container/PM2 สั่งหยุด เพื่อไม่ให้ request ที่ค้างถูกตัดกลางทาง
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`[${signal}] shutting down...`);
    server.close(() => process.exit(0));
  });
});

module.exports = server;
