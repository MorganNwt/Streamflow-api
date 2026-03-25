const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');

router.post('/start', (req, res) => {
  try {
    const { userId, contentId, device } = req.body;
    const session = playerService.startSession(userId, contentId, device);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;