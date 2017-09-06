const express = require('express');
const Snippet = require("../models/snippet");

const router = express.Router({mergeParams: true});

// add routes that can work outside of app.js

module.exports = router;
