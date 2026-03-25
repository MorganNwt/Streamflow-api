const express = require('express');

const catalogRoutes = require('./routes/catalog');
const subscriptionRoutes = require('./routes/subscriptions');
const playerRoutes = require('./routes/player');
const recommendationRoutes = require('./routes/recommendations');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'StreamFlow API is running' });
});

app.use('/catalog', catalogRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/player', playerRoutes);
app.use('/recommendations', recommendationRoutes);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}