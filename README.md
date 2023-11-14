# waei-jiten


## Dataset Description

**Title:** Waei Jiten Data  
**Description:** Japanese-English dictionary with example sentences  
**Author:** Heidi Sokolovski  
**Publication Date:** 2023-10-30  
**Source:** https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project  
**Language:** English, Japanese  
**Character Encoding:** UTF-8  
**License:** Creative Commons Attribution-ShareAlike 4.0 International License  
**Distributions:** CSV, JSON  
**Current Version:** 1.0

## Dataset Attributes

| Attribute | Description                                                                                              |
|-----------|----------------------------------------------------------------------------------------------------------|
| entry_id  | Unique identifier for each entry                                                                         |
| kanji_element_id | Unique identifier for each kanji element                                                                 |
| kanji | Kanji element; a word or short phrase in Japanese which is written using at least one non-kana character |
| kanji_info | Kanji information related specifically to the orthography                                                |
| reading_element_id | Unique identifier for each reading element                                                               |
| reading | Reading element; the valid readings of the word(s) in the kanji element using modern kanadzukai          |
| reading_nokanji | Indicates that the reading cannot be regarded as a true reading of the kanji                             |
| reading_info | Reading information                                                                                      |
| reading_restraint_id | Unique identifier for each reading restraint                                                             |
| reading_restraint | Indicates when the reading only applies to a subset of the keb elements                                  |
| sense_id | Unique identifier for each sense                                                                         |
| pos | Part of speech information                                                                               |
| field | Field information                                                                                        |
| misc | Miscellaneous information                                                                                |
| dialect | Dialect information                                                                                      |
| sense_kanji_restriction_id | Unique identifier for each sense kanji restriction                                                       |
| kanji_restriction | Sense is restricted to the kanji                                                                         |
| sense_reading_restriction_id | Unique identifier for each sense reading restriction                                                     |
| reading_restriction | Sense is restricted to the reading                                                                       |
| sense_xref_id | Unique identifier for each sense cross-reference                                                         |
| xref | Indicates a cross-reference to another entry with a similar or related meaning or sense                  |
| sense_antonym_id | Unique identifier for each sense antonym                                                                 |
| antonym | Indicates another entry which is an antonym of the current entry                                         |
| sense_gloss_id | Unique identifier for each sense gloss                                                                   |
| gloss | Target-language words or phrases which are equivalents to the Japanese word                              |
| sense_example_id | Unique identifier for each sense example                                                                 |
| sense_text | Sense text                                                                                               |
| japanese_sentence | Japanese sentence                                                                                        |
| english_sentence | English sentence                                                                                         |




## License

Shield: [![CC BY-SA 4.0][cc-by-sa-shield]][cc-by-sa]

This work is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License][cc-by-sa].

[![CC BY-SA 4.0][cc-by-sa-image]][cc-by-sa]

[cc-by-sa]: http://creativecommons.org/licenses/by-sa/4.0/

[cc-by-sa-image]: https://licensebuttons.net/l/by-sa/4.0/88x31.png

[cc-by-sa-shield]: https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg
