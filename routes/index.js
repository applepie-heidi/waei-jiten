const express = require('express');
const pool = require("../db/pgadmin");
const router = express.Router();
require('dotenv').config();

const dataDirectory = process.env.DATA_DIRECTORY;

// TODO: https://www.npmjs.com/package/express-flash-message
function flash(req, res, status, message) {
    req.session.flash = {
        status,
        message
    }
    // res.locals.flash = req.session.flash;
}

/* GET home page. */
router.get('/', async (req, res, next) => {
    let username;
    console.log("index")
    if (req.oidc.isAuthenticated()) {
        console.log("AUTH YES")
        username = req.oidc.user?.nickname ?? req.oidc.user?.sub;
    }
    res.render('index', {username});
});

router.get("/sign-up", (req, res) => {
    console.log("sign-up")
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});

router.get("/logout", (req, res) => {
    res.oidc.logout({
        returnTo: '/'
    })
});

router.get("/refresh", async (req, res) => {
    try {
        var result = await pool.query(`SELECT json_agg(row_to_json(wjt)) AS json_object
FROM (SELECT e.entry_id,
       kanji,
       kanji_info,
       reading,
       reading_nokanji,
       reading_info,
       pos,
       field,
       misc,
       dialect,
       gloss,
       sense_text,
       japanese_sentence,
       english_sentence
FROM entry AS e
         LEFT JOIN kanji_element AS ke ON e.entry_id = ke.entry_id
         LEFT JOIN reading_element AS re ON e.entry_id = re.entry_id
         LEFT JOIN reading_restraint AS rr ON re.reading_element_id = rr.reading_element_id
         LEFT JOIN sense AS s ON e.entry_id = s.entry_id
         LEFT JOIN sense_kanji_restriction AS skr ON s.sense_id = skr.sense_id
         LEFT JOIN sense_reading_restriction AS srr ON s.sense_id = srr.sense_id
         LEFT JOIN sense_xref AS sx ON s.sense_id = sx.sense_id
         LEFT JOIN sense_antonym AS sa ON s.sense_id = sa.sense_id
         LEFT JOIN sense_gloss AS sg ON s.sense_id = sg.sense_id
         LEFT JOIN sense_example AS se ON s.sense_id = se.sense_id) wjt`);
        // Save to file
        const json_string = JSON.stringify(result.rows[0].json_object);
        const fs = require('fs').promises;
        await fs.writeFile(`${dataDirectory}/waei_jiten_data.json`, json_string);


        await pool.query(`COPY (SELECT e.entry_id,
       kanji,
       kanji_info,
       reading,
       reading_nokanji,
       reading_info,
       pos,
       field,
       misc,
       dialect,
       gloss,
       sense_text,
       japanese_sentence,
       english_sentence
FROM entry AS e
         LEFT JOIN kanji_element AS ke ON e.entry_id = ke.entry_id
         LEFT JOIN reading_element AS re ON e.entry_id = re.entry_id
         LEFT JOIN reading_restraint AS rr ON re.reading_element_id = rr.reading_element_id
         LEFT JOIN sense AS s ON e.entry_id = s.entry_id
         LEFT JOIN sense_kanji_restriction AS skr ON s.sense_id = skr.sense_id
         LEFT JOIN sense_reading_restriction AS srr ON s.sense_id = srr.sense_id
         LEFT JOIN sense_xref AS sx ON s.sense_id = sx.sense_id
         LEFT JOIN sense_antonym AS sa ON s.sense_id = sa.sense_id
         LEFT JOIN sense_gloss AS sg ON s.sense_id = sg.sense_id
         LEFT JOIN sense_example AS se ON s.sense_id = se.sense_id) TO '${dataDirectory}/waei_jiten_data.csv' WITH (FORMAT CSV, HEADER)`);
    } catch (e) {
        console.log(e);
        flash(req, res, "error", "Failed to refresh data: " + e.message);
        res.redirect("/");
        return;
    }
    flash(req, res, "success", "Refreshed data");
    res.redirect("/");
});
module.exports = router;
