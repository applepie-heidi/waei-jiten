-- Drop tables if they exist
DROP TABLE IF EXISTS entry, kanji_element, reading_element, reading_restraint, sense, sense_kanji_restriction, sense_reading_restriction, sense_xref, sense_antonym, sense_gloss, sense_example CASCADE;


-- Create tables
CREATE TABLE entry
(
    entry_id INT NOT NULL PRIMARY KEY -- ent_seq

);

CREATE TABLE kanji_element
(
    kanji_element_id SERIAL PRIMARY KEY,
    entry_id         INT         NOT NULL,
    kanji            VARCHAR(50) NOT NULL,
    kanji_info       VARCHAR(255),
    CONSTRAINT fk_kanji_element_entry FOREIGN KEY (entry_id) REFERENCES entry (entry_id)
);

CREATE TABLE reading_element
(
    reading_element_id SERIAL PRIMARY KEY,
    entry_id           INT         NOT NULL,
    reading            VARCHAR(50) NOT NULL,
    reading_nokanji    BOOLEAN     NOT NULL,
    reading_info       VARCHAR(255),
    CONSTRAINT fk_reading_element_entry FOREIGN KEY (entry_id) REFERENCES entry (entry_id)
);

CREATE TABLE reading_restraint
(
    reading_restraint_id SERIAL PRIMARY KEY,
    reading_element_id   INT         NOT NULL,
    reading_restraint    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_reading_restraint_reading_element FOREIGN KEY (reading_element_id) REFERENCES reading_element (reading_element_id)
);

CREATE TABLE sense
(
    sense_id SERIAL PRIMARY KEY,
    entry_id INT NOT NULL,
    pos      VARCHAR(255),
    field    VARCHAR(255),
    misc     VARCHAR(255),
    dialect  VARCHAR(255),
    CONSTRAINT fk_sense_entry FOREIGN KEY (entry_id) REFERENCES entry (entry_id)
);

CREATE TABLE sense_kanji_restriction
(
    sense_kanji_restriction_id SERIAL PRIMARY KEY,
    sense_id                   INT         NOT NULL,
    kanji_restriction          VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sense_kanji_restriction_sense FOREIGN KEY (sense_id) REFERENCES sense (sense_id)
);

CREATE TABLE sense_reading_restriction
(
    sense_reading_restriction_id SERIAL PRIMARY KEY,
    sense_id                     INT         NOT NULL,
    reading_restriction          VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sense_reading_restriction_sense FOREIGN KEY (sense_id) REFERENCES sense (sense_id)
);

CREATE TABLE sense_xref
(
    sense_xref_id SERIAL PRIMARY KEY,
    sense_id      INT         NOT NULL,
    xref          VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sense_xref_sense FOREIGN KEY (sense_id) REFERENCES sense (sense_id)
);

CREATE TABLE sense_antonym
(
    sense_antonym_id SERIAL PRIMARY KEY,
    sense_id         INT         NOT NULL,
    antonym          VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sense_antonym_sense FOREIGN KEY (sense_id) REFERENCES sense (sense_id)
);

CREATE TABLE sense_gloss
(
    sense_gloss_id SERIAL PRIMARY KEY,
    sense_id       INT          NOT NULL,
    gloss          VARCHAR(500) NOT NULL,
    CONSTRAINT fk_sense_gloss_sense FOREIGN KEY (sense_id) REFERENCES sense (sense_id)
);

CREATE TABLE sense_example
(
    sense_example_id  SERIAL PRIMARY KEY,
    sense_id          INT          NOT NULL,
    sense_text              VARCHAR(50)  NOT NULL,
    japanese_sentence VARCHAR(1000) NOT NULL,
    english_sentence  VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_sense_example_sense FOREIGN KEY (sense_id) REFERENCES sense (sense_id)
);

/*

class Sense:
    poses = [SensePos(), SensePos()]
    glosses = [Gloss(), Gloss()]

class SensePos:
    pos: str
*/