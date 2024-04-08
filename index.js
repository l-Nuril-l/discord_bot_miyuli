import express from 'express';


const app = express();
app.get('/', (req, res) => {
  res.send('Hello Express app!')
});
app.get('/a', (req, res) => {
  res.send('Hello Express app! A')
});
app.listen(process.env.PORT || 80, () => {
  console.log('server started');
});

export default app;
