// backend/testServer.js
import express from 'express';

const app = express();
const port = 3003;

app.get('/testing', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(port, () => {
  console.log(`✅ Test server running at http://localhost:${port}`);
});