const express = require('express');
const router = express.Router();
const girabotController = require('../controllers/girabot.controller');

router.post('/', girabotController.conversar);

module.exports = router;
