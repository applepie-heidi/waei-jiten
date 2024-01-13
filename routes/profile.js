const express = require('express');
const {requiresAuth} = require("express-openid-connect");
const router = express.Router();

/* GET home page. */
router.get('/', requiresAuth(), async (req, res, next) => {
    res.render('profile', {});
});

module.exports = router;
