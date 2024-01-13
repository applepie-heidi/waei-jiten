const express = require('express');
const {requiresAuth} = require("express-openid-connect");
const router = express.Router();

/* GET home page. */
router.get('/', requiresAuth(), async (req, res, next) => {
    const user = await req.oidc.fetchUserInfo();
    res.render('profile', {user});
});

module.exports = router;
