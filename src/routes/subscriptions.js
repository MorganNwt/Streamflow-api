const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');

router.post('/', (req, res) => {
  try {
    const { userId, plan, options } = req.body;
    const subscription = subscriptionService.subscribe(userId, plan, options);
    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;