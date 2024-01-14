const express = require('express');
const router = express.Router();
const pool = require('../db/pgadmin');
const fs = require('fs');

const select_sql = `SELECT e.entry_id,
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
         LEFT JOIN sense_example AS se ON s.sense_id = se.sense_id`;

router.get('/openapi', async (req, res) => {
    fs.readFile("openapi.json", "utf-8", function (err, data) {
        if (err) throw err;
        data = JSON.parse(data);

        let response = {
            "status": "200 OK",
            "message": "Successfully fetched the OpenAPI specification",
            "response": [data]
        }
        res.set({
            'method': 'GET',
            'status': '200 OK',
            'message': 'Successfully fetched the OpenAPI specification',
            'Content-type': 'application/json'
        });
        res.status(200).send(response);
    });
});

router.get('/', async (req, res) => {
    let data = (await (await pool.query(select_sql))).rows;

    for (let i = 0; i < data.length; i++) {
        data[i] = {
            "@type": "ex:kanji",
            ...data[i]
        }
    }

    let response = {
        "status": "200 OK",
        "message": "All data fetched",
        "response": {
            "ex": "http://example.org/",
            "data": {
                "@type": "ex:kanji",
                "@id": "ex:kanji",
                "@container": "@set",
                "kanji": "https://schema.org/name",
            }
        },
        "@type": "response",
        "@id": "ex:response",
        "data": [data]
    };
    res.set({
        'method': 'GET',
        'status': '200 OK',
        'message': 'All data fetched',
        'Content-type': 'application/json'
    });
    res.status(200).send(response);
});

router.get('/kanji', async (req, res) => {
    const data = (await (await pool.query(`SELECT DISTINCT kanji FROM kanji_element`))).rows;

    let response = {
        "status": "200 OK",
        "message": "All kanji fetched",
        "response": [{
            "kanji": "kanji",
        }, data]
    };
    res.set({
        'method': 'GET',
        'status': '200 OK',
        'message': 'All kanji fetched',
        'Content-type': 'application/json'
    });
    res.status(200).send(response);

});

router.get('/me', async (req, res) => {
    const user = await req.oidc.fetchUserInfo();
    let userLd = {
        "status": "200 OK",
        "message": "User fetched",
        "response": [{

            "@context": {
                "@vocab": "https://schema.org/",
                "name": "https://schema.org/name",
                "email": "https://schema.org/email",
                "picture": "https://schema.org/image"
            },
            "@type": "Person",
            "name": user.name,
            "email": user.email,
            "picture": user.picture
        }]
    }
    res.status(200).send(userLd);
});

router.get('/reading', async (req, res) => {
    const data = (await (await pool.query(`SELECT DISTINCT reading FROM reading_element`))).rows;

    let response = {
        "status": "200 OK",
        "message": "All readings fetched",
        "response": [{
            "reading": "reading",
        }, data]
    };

    res.set({
        'method': 'GET',
        'status': '200 OK',
        'message': 'All readings fetched',
        'Content-type': 'application/json'
    });
    res.status(200).send(response);
});

router.get('/gloss', async (req, res) => {
    const data = (await (await pool.query(`SELECT DISTINCT gloss FROM sense_gloss`))).rows;

    let response = {
        "status": "200 OK",
        "message": "All glosses fetched",
        "response": [{
            "gloss": "gloss",
        }, data]
    };

    res.set({
        'method': 'GET',
        'status': '200 OK',
        'message': 'All glosses fetched',
        'Content-type': 'application/json'
    });
    res.status(200).send(response);
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    await idChecker(id, req.method, res)
    try {

        const sql = `${select_sql} WHERE e.entry_id=$1`;
        const data = (await (await pool.query(sql, [id]))).rows;


        let response = {
            "status": "200 OK",
            "message": "Data with the provided id fetched",
            "response": [data]
        };
        res.set({
            'method': 'GET',
            'status': '200 OK',
            'message': 'All data fetched',
            'Content-type': 'application/json',
            'warning': "with content type charset encoding will be added by default"
        });

        res.status(200).send(response);
    } catch (err) {
    }

});


async function idChecker(id, method, res) {
    const ids = (await pool.query('select entry_id from entry')).rows;
    if (isNaN(id)) {
        res.set({
            'method': method,
            'status': '400 Bad Request',
            'message': "The server could not understand the request due to invalid syntax",
            'Content-type': 'application/json'
        });
        let response = {
            'status': "400 Bad Request",
            'message': "The server could not understand the request due to invalid syntax",
            "response": null
        };
        res.status(400).send(response);
    }
    let exists = false;
    for (let i = 0; i < ids.length; i++) {
        if (id === ids[i].entry_id.toString()) {
            exists = true;
            break;
        }
    }
    if (!exists) {
        res.set({
            'method': 'GET',
            'status': '404 Not Found',
            'message': "Entry with the provided id doesn't exist",
            'Content-type': 'application/json'
        });
        let response = {
            'status': "404 Not Found",
            'message': "Entry with the provided id doesn't exist",
            'response': null
        };
        res.status(404).send(response);
    }
}

router.post('/', async (req, res) => {
    let response;
    const maxIdBefore = (await pool.query(`select max(entry_id) from entry`)).rows[0].max;
    console.log("maxIdBefore", maxIdBefore);

    if (req.body.kanji === undefined || req.body.kanji_info === undefined || req.body.reading === undefined ||
        req.body.reading_nokanji === undefined || req.body.reading_info === undefined || req.body.pos === undefined ||
        req.body.field === undefined || req.body.misc === undefined || req.body.dialect === undefined ||
        req.body.gloss === undefined || req.body.sense_text === undefined || req.body.japanese_sentence === undefined ||
        req.body.english_sentence === undefined) {
        res.status(400).send('Invalid input');
    }

    let data = req.body;
    const kanji = req.body.kanji;
    const kanji_info = req.body.kanji_info;
    const reading = req.body.reading;
    const readingNokanji = req.body.reading_nokanji;
    const reading_info = req.body.reading_info;
    const pos = req.body.pos;
    const field = req.body.field;
    const misc = req.body.misc;
    const dialect = req.body.dialect;
    const gloss = req.body.gloss;
    const senseText = req.body.sense_text;
    const japaneseSentence = req.body.japanese_sentence;
    const englishSentence = req.body.english_sentence;

    const old_entry = (await pool.query(`SELECT kanji FROM kanji_element WHERE kanji like $1`, [kanji])).rows[0];
    if (!old_entry) {
        await pool.query(`INSERT INTO entry (entry_id) VALUES ($1)`, [maxIdBefore + 1]);
        await pool.query(`INSERT INTO kanji_element (entry_id, kanji, kanji_info) VALUES($1, $2, $3)`, [maxIdBefore + 1, kanji, kanji_info]);
        await pool.query(`INSERT INTO reading_element (entry_id, reading, reading_nokanji, reading_info) VALUES($1, $2, $3, $4)`, [maxIdBefore + 1, reading, readingNokanji, reading_info]);
        await pool.query(`INSERT INTO sense (entry_id, pos, field, misc, dialect) VALUES($1, $2, $3, $4, $5)`, [maxIdBefore + 1, pos, field, misc, dialect]);
        const senseId = (await pool.query(`select max(sense_id) from sense`)).rows[0].max;
        await pool.query(`INSERT INTO sense_gloss (sense_id, gloss) VALUES($1, $2)`, [senseId, gloss]);
        await pool.query(`INSERT INTO sense_example (sense_id, sense_text, japanese_sentence, english_sentence) VALUES($1, $2, $3, $4)`, [senseId, senseText, japaneseSentence, englishSentence]);
    }
    const maxIdAfter = (await pool.query(`select max(entry_id) from entry`)).rows[0].max;
    if (maxIdBefore === maxIdAfter) {
        data['entry_id'] = maxIdBefore;
        response = {
            "status": "200 OK",
            "message": "Entry with the provided information already exists",
            "response": [data]
        };
        res.set({
            'method': 'POST',
            'status': '200 OK',
            'message': 'Entry with the provided information already exists',
            'Content-type': 'application/json'
        });
    } else {
        data['entry_id'] = maxIdAfter;
        response = {
            "status": "201 Created",
            "message": "The request succeeded, and a new resource was created as a result",
            "response": [data]
        };
        res.set({
            'method': 'POST',
            'status': '201 Created',
            'message': 'The request succeeded, and a new resource was created as a result',
            'Content-type': 'application/json'
        });
    }
    res.status(200).send(response);
});

router.put('/:id', async (req, res) => {
    const id = req.params.id;
    await idChecker(id, req.method, res)

    const body = req.body;

    if (req.body.kanji === undefined || req.body.kanji_info === undefined || req.body.reading === undefined ||
        req.body.reading_nokanji === undefined || req.body.reading_info === undefined || req.body.pos === undefined ||
        req.body.field === undefined || req.body.misc === undefined || req.body.dialect === undefined ||
        req.body.gloss === undefined || req.body.sense_text === undefined || req.body.japanese_sentence === undefined ||
        req.body.english_sentence === undefined) {
        res.status(400).send('The server could not understand the request due to invalid syntax');
    }

    await pool.query(`UPDATE kanji_element SET kanji = $1, kanji_info = $2 WHERE entry_id = $3`, [body.kanji, body.kanji_info, id]);
    await pool.query(`UPDATE reading_element SET reading = $1, reading_nokanji = $2, reading_info = $3 WHERE entry_id = $4`, [body.reading, body.reading_nokanji, body.reading_info, id]);
    await pool.query(`UPDATE sense SET pos = $1, field = $2, misc = $3, dialect = $4 WHERE entry_id = $5`, [body.pos, body.field, body.misc, body.dialect, id]);
    const senseId = (await pool.query(`select sense_id from sense where entry_id = $1`, [id])).rows[0].sense_id;
    await pool.query(`UPDATE sense_gloss SET gloss = $1 WHERE sense_id = $2`, [body.gloss, senseId]);
    await pool.query(`UPDATE sense_example SET sense_text = $1, japanese_sentence = $2, english_sentence = $3 WHERE sense_id = $4`, [body.sense_text, body.japanese_sentence, body.english_sentence, senseId]);

    let response = {
        "status": "200 OK",
        "message": "The request succeeded",
        "response": [body]
    };
    res.status(200).send(response);

});

router.delete('/:id', async (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    const id = req.params.id;

    await idChecker(id, req.method, res);

    try {

        const senseId = (await pool.query(`SELECT sense_id FROM sense where entry_id=$1`, [id])).rows[0].sense_id;

        if (!senseId) {
            console.log("No sense id found");
        }
        await pool.query(`DELETE FROM sense_example WHERE sense_id=$1;`, [senseId]);
        await pool.query(`DELETE FROM sense_gloss WHERE sense_id=$1;`, [senseId]);
        await pool.query(`DELETE FROM sense WHERE entry_id=$1;`, [id]);
        await pool.query(`DELETE FROM kanji_element WHERE entry_id=$1;`, [id]);
        await pool.query(`DELETE FROM reading_element WHERE entry_id=$1;`, [id]);
        await pool.query(`DELETE FROM entry WHERE entry_id=$1;`, [id]);

        const response = {
            "status": "200 OK",
            "message": "Entry with the provided id successfully deleted",
            "response": null
        };

        res.status(200).send(response);
    } catch (err) {
    }
});

module.exports = router;