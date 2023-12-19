const express = require('express');
const router = express.Router();
const pool = require('../db/pgadmin');

const select_id_sql = `SELECT kanji, kanji_info, reading, reading_info, pos, field, misc, dialect, gloss, japanese_sentence, english_sentence
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

        let response = format(`{
            "status": "200 OK",
            "message": "Successfully fetched the OpenAPI specification",
            "response": {
                    "kanji": "kanji",
                    "kanji_info": "kanji_info",
                    "reading": "reading",
                    "reading_info": "reading_info",
                    "pos": "pos",
                    "field": "field",
                    "misc": "misc",
                    "dialect": "dialect",
                    "gloss": "gloss",
                    "japanese_sentence": "japanese_sentence",
                    "english_sentence": "english_sentence"
                }
        }`, data);
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
    fs.readFile("./public/data/waei-jiten.json", "utf-8", function (err, data) {
        if (err) throw err;

        data = JSON.parse(data);

        let response = format(`{
            "status": "200 OK",
            "message": "All data fetched",
            "response": {
                    "kanji": "kanji",
                    "kanji_info": "kanji_info",
                    "reading": "reading",
                    "reading_info": "reading_info",
                    "pos": "pos",
                    "field": "field",
                    "misc": "misc",
                    "dialect": "dialect",
                    "gloss": "gloss",
                    "japanese_sentence": "japanese_sentence",
                    "english_sentence": "english_sentence"
                }
        }`, data);
        res.set({
            'method': 'GET',
            'status': '200 OK',
            'message': 'All data fetched',
            'Content-type': 'application/json'
        });
        res.status(200).send(response);
    });
});

router.get('/kanji', async (req, res) => {
    var data = (await (await pool.query(`SELECT DISTINCT kanji FROM kanji_element`))).rows;

    let response = format(`{
        "status": "200 OK",
        "message": "All kanji fetched",
        "response": {
                "kanji": "kanji",
            }
    }`, data);
    res.set({
        'method': 'GET',
        'status': '200 OK',
        'message': 'All kanji fetched',
        'Content-type': 'application/json'
    });
    res.status(200).send(response);

});

router.get('/reading', async (req, res) => {
    var data = (await (await pool.query(`SELECT DISTINCT reading FROM reading_element`))).rows;

    let response = format(`{
        "status": "200 OK",
        "message": "All readings fetched",
        "response": {
                "reading": "reading",
            }
    }`, data);

    res.set({
        'method': 'GET',
        'status': '200 OK',
        'message': 'All readings fetched',
        'Content-type': 'application/json'
    });
    res.status(200).send(response);
});

router.get('/gloss', async (req, res) => {
    var data = (await (await pool.query(`SELECT DISTINCT reading FROM reading_element`))).rows;

    let response = format(`{
        "status": "200 OK",
        "message": "All glosses fetched",
        "response": {
                "gloss": "gloss",
            }
    }`, data);

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

    var sql = format(`%s WHERE entry.entry_id=%s`, select_id_sql, id);
    var api = format(`COPY (select json_agg(row_to_json(entry)) FROM (%s) entry)
                    to 'tmp/api.json'`, sql);
    await pool.query(api);

    fs.readFile("./tmp/api.json", "utf-8", function (err, data) {
        if (err) throw err;
        data = JSON.parse(data);

        let response = format(`{
            "status": "200 OK",
            "message": "Data with id = %s fetched",
            "response":{
                    "kanji": "kanji",
                    "kanji_info": "kanji_info",
                    "reading": "reading",
                    "reading_info": "reading_info",
                    "pos": "pos",
                    "field": "field",
                    "misc": "misc",
                    "dialect": "dialect",
                    "gloss": "gloss",
                    "japanese_sentence": "japanese_sentence",
                    "english_sentence": "english_sentence"
                }
        }`, id, data);
        res.set({
            'method': 'GET',
            'status': '200 OK',
            'message': 'All data fetched',
            'Content-type': 'application/json',
            'warning': "with content type charset encoding will be added by default"
        });

        res.status(200).send(response);
    });
});


async function idChecker(id, method, res) {
    var ids = (await pool.query('select entry_id from entry')).rows;
    if (isNaN(id)) {
        res.set({
            'method': method,
            'status': '400 Bad Request',
            'message': "The server could not understand the request due to invalid syntax.",
            'Content-type': 'application/json'
        });
        let response = {
            'status': "400 Bad Request",
            'message': "The server could not understand the request due to invalid syntax.",
            "response": null
        };
        res.status(400).send(response);
    }
    let exists = false;
    for (var i = 0; i < ids.length; i++) {
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
    var maxidBefore = (await pool.query(`select max(entry_id) from entry`)).rows[0].max;

    if (!req.body.kanji || !req.body.kanji_info || !req.body.reading || !req.body.reading_info ||
        !req.body.pos || !req.body.field || !req.body.misc || !req.body.dialect || !req.body.gloss ||
        !req.body.japanese_sentence || !req.body.english_sentence) {
        res.status(400).send('Invalid input');
    }

    let data = req.body;
    const kanji = req.body.kanji;
    const kanji_info = req.body.kanji_info;
    const reading = req.body.reading;
    const reading_info = req.body.reading_info;
    const pos = req.body.pos;
    const field = req.body.field;
    const misc = req.body.misc;
    const dialect = req.body.dialect;
    const gloss = req.body.gloss;
    const japanese_sentence = req.body.japanese_sentence;
    const english_sentence = req.body.english_sentence;


    var old_entry = (await pool.query(format(`SELECT kanji_element FROM kanji WHERE kanji_element like '%s'`, kanji))).rows[0];
    if (!old_entry) {
        await pool.query(format(`INSERT INTO entry (entry_id) VALUES (%s);`, maxidBefore + 1));
        await pool.query(format(`INSERT INTO kanji (entry_id, kanji_element, kanji_info) VALUES('%s','%s', '%s');`, maxidBefore + 1, kanji, kanji_info));
        await pool.query(format(`INSERT INTO reading (entry_id, reading_element, reading_info) VALUES('%s','%s', '%s');`, maxidBefore + 1, reading, reading_info));
        await pool.query(format(`INSERT INTO sense (entry_id, pos, field, misc, dialect) VALUES('%s','%s', '%s', '%s', '%s');`, maxidBefore + 1, pos, field, misc, dialect));
        var senseId = (await pool.query(`select max(sense_id) from sense`)).rows[0].max;
        await pool.query(format(`INSERT INTO sense_gloss (sense_id, gloss) VALUES('%s','%s');`, senseId, gloss));
        await pool.query(format(`INSERT INTO sense_example (sense_id, japanese_sentence, english_sentence) VALUES('%s','%s', '%s');`, senseId, japanese_sentence, english_sentence));
    }
    var maxidAfter = (await pool.query(`select max(entry_id) from entry`)).rows[0].max;
    if (maxidBefore === maxidAfter) {
        var response = format(`{
            "status": "200 OK",
            "message": "Emtry with the provided information already exists",
            "response": {
                    "kanji": "kanji",
                    "kanji_info": "kanji_info",
                    "reading": "reading",
                    "reading_info": "reading_info",
                    "pos": "pos",
                    "field": "field",
                    "misc": "misc",
                    "dialect": "dialect",
                    "gloss": "gloss",
                    "japanese_sentence": "japanese_sentence",
                    "english_sentence": "english_sentence"
                }
        }`, data);
        res.set({
            'method': 'POST',
            'status': '200 OK',
            'message': 'Entry with the provided information already exists',
            'Content-type': 'application/json'
        });
    } else {
        var response = format(`{
            "status": "201 Created",
            "message": "The request succeeded, and a new resource was created as a result",
            "response":  {
                    "kanji": "kanji",
                    "kanji_info": "kanji_info",
                    "reading": "reading",
                    "reading_info": "reading_info",
                    "pos": "pos",
                    "field": "field",
                    "misc": "misc",
                    "dialect": "dialect",
                    "gloss": "gloss",
                    "japanese_sentence": "japanese_sentence",
                    "english_sentence": "english_sentence"
                }
        }`, data);
        res.set({
            'method': 'POST',
            'status': '201 Created',
            'message': 'The request succeeded, and a new resource was created as a result',
            'Content-type': 'application/json'
        });
    }
    response = JSON.parse(response);
    res.status(200).send(response);
});

router.put('/:id', async (req, res) => {
    let sql;
    const id = req.params.id;
    await idChecker(id, req.method, res)

    const body = req.body;
    const original = (await pool.query(format(`%s WHERE entry_id=%s`, select_id_sql, id))).rows[0];

    if (body.kanji !== original.kanji) {
        sql = format(`UPDATE kanji SET kanji_element = '%s' WHERE entry_id='%s';`, body.kanji, id);
        await pool.query(sql);

    }
    if (body.kanji_info !== original.kanji_info) {
        sql = format(`UPDATE kanji SET kanji_info = '%s' WHERE entry_id='%s';`, body.kanji_info, id);
        await pool.query(sql);
    }
    if (body.reading !== original.reading) {
        sql = format(`UPDATE reading SET reading_element = '%s' WHERE entry_id='%s';`, body.reading, id);
        await pool.query(sql);
    }
    if (body.reading_info !== original.reading_info) {
        sql = format(`UPDATE reading SET reading_info = '%s' WHERE entry_id='%s';`, body.reading_info, id);
        await pool.query(sql);
    }
    if (body.pos !== original.pos) {
        sql = format(`UPDATE sense SET pos = '%s' WHERE entry_id='%s';`, body.pos, id);
        await pool.query(sql);
    }
    if (body.field !== original.field) {
        sql = format(`UPDATE sense SET field = '%s' WHERE entry_id='%s';`, body.field, id);
        await pool.query(sql);
    }
    if (body.misc !== original.misc) {
        sql = format(`UPDATE sense SET misc = '%s' WHERE entry_id='%s';`, body.misc, id);
        await pool.query(sql);
    }
    if (body.dialect !== original.dialect) {
        sql = format(`UPDATE sense SET dialect = '%s' WHERE entry_id='%s';`, body.dialect, id);
        await pool.query(sql);
    }
    if (body.gloss !== original.gloss) {
        var senseId = (await pool.query(`select sense_id from sense where entry_id='%s';`, id)).rows[0].sense_id;
        sql = format(`UPDATE sense_gloss SET gloss = '%s' WHERE sense_id=%s`, body.gloss, senseId);
        await pool.query(sql);
    }
    if (body.japanese_sentence !== original.japanese_sentence) {
        var senseId = (await pool.query(`select sense_id from sense where entry_id='%s'`, id)).rows[0].sense_id;
        sql = format(`UPDATE sense_example SET japanese_sentence = '%s' WHERE sense_id='%s';`, body.japanese_sentence, senseId);
        await pool.query(sql);
    }
    if (body.english_sentence !== original.english_sentence) {
        var senseId = (await pool.query(`select sense_id from sense where entry_id='%s'`, id)).rows[0].sense_id;
        sql = format(`UPDATE sense_example SET english_sentence = '%s' WHERE sense_id='%s';`, body.english_sentence, senseId);
        await pool.query(sql);
    }

    var response = format(`{
        "status": "200 OK",
        "message": "The request succeeded",
        "response": {
                "kanji": "kanji",
                "kanji_info": "kanji_info",
                "reading": "reading",
                "reading_info": "reading_info",
                "pos": "pos",
                "field": "field",
                "misc": "misc",
                "dialect": "dialect",
                "gloss": "gloss",
                "japanese_sentence": "japanese_sentence",
                "english_sentence": "english_sentence"
            }
    }`, body);
    response = JSON.parse(response);
    res.status(200).send(response);

});


router.delete('/:id', async (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    const id = req.params.id;

    await idChecker(id, req.method, res);

    await pool.query(format(`DELETE FROM entry WHERE entry_id=%s;`, id));
    var response = {
        "status": "200 OK",
        "message": "Entry with the provided was successfully deleted",
        "response": null
    };

    res.status(200).send(response);
});

module.exports = router;