import express from '../core/express';

const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
})

app.use((req, res) => {
  res.end('Hello World');
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})