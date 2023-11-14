const express = require('express');
const router = express.Router();
const pool = require('../db/pgadmin');

const attributes = ['kanji', 'kanji_info', 'reading', 'reading_info', 'pos', 'field', 'misc', 'dialect', 'gloss', 'japanese_sentence', 'english_sentence'];

router.get('/globalData', async (req, res, next) => {
    res.setHeader('Content-disposition', 'attachment; filename=pero.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(globalData));
});

/* GET datatable page. */
router.get('/', async (req, res, next) => {
    let selectQuery = `SELECT e.entry_id,
                   ke.kanji_element_id,
                   ke.kanji,
                   ke.kanji_info,
                   re.reading_element_id,
                   re.reading,
                   re.reading_nokanji,
                   re.reading_info,
                   rr.reading_restraint_id,
                   rr.reading_restraint,
                   s.sense_id,
                   s.pos,
                   s.field,
                   s.misc,
                   s.dialect,
                   skr.sense_kanji_restriction_id,
                   skr.kanji_restriction,
                   srr.sense_reading_restriction_id,
                   srr.reading_restriction,
                   sx.sense_xref_id,
                   sx.xref,
                   sa.sense_antonym_id,
                   sa.antonym,
                   sg.sense_gloss_id,
                   sg.gloss,
                   se.sense_example_id,
                   se.sense_text,
                   se.japanese_sentence,
                   se.english_sentence
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
                     LEFT JOIN sense_example AS se ON s.sense_id = se.sense_id`
    const results = await pool.query(selectQuery);

    const entries = [];
    let entry_id = 0;
    let entry = {};
    for (let i = 0; i < results.rows.length; i++) {
        let entry_id2 = results.rows[i].entry_id;
        if (entry_id != entry_id2) {
            if (Object.keys(entry).length != 0) {
                entries.push(entry);
            }
            entry_id = entry_id2;
            entry = {};
        }
        for (let j = 0; j < attributes.length; j++) {
            if (entry[attributes[j]] == null) {
                entry[attributes[j]] = "";
            }
            let rowElement = results.rows[i][attributes[j]];
            if (rowElement != null) {
                if (entry[attributes[j]] == "") {
                    entry[attributes[j]] = rowElement;
                } else {
                    if (entry[attributes[j]].includes(rowElement) == false) {
                        entry[attributes[j]] = entry[attributes[j]].concat('; ', rowElement);
                    }
                }
            }
        }
    }
    if (Object.keys(entry).length != 0) {
        entries.push(entry);
    }

    res.render('datatable', {
        entries: entries,
        attributes: attributes,
    });
});

var globalData = null;

// POST datatable page.
router.post('/', async (req, res) => {
    const receivedData = req.body;
    console.log('Received data:', receivedData);
    /// Create a file or any downloadable content
    const content = 'Example content';

    const entries = receivedData.map(entryData => {
        const entry = {};
        attributes.forEach((attribute, index) => {
            entry[attribute] = entryData[index];
        });
        return entry;
    });

    // Now entries is an array of objects where each object represents an entry
    const jsonData = JSON.stringify(entries, null, 2);
    console.log(jsonData);
    globalData = jsonData;

    // return json data as download
    // res.setHeader('Content-disposition', 'attachment; filename=example.json');
    res.setHeader('Content-type', 'application/json');
    res.send(jsonData);
});

module.exports = router;