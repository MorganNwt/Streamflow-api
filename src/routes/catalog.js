const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');

router.post('/', (req, res) => {
  try {
    const content = catalogService.addContent(req.body);
    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const contents = catalogService.getAllContents();
    res.json(contents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;