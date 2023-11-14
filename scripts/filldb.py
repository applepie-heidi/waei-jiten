import xml.etree.ElementTree as et
import os
from dotenv import load_dotenv
import psycopg2


def execute_sql_script(cur, sql_file):
    """Execute a sql script file"""
    with open(sql_file, 'r') as f:
        sql_file = f.read()
        sql_commands = sql_file.split(';')
        for command in sql_commands:
            try:
                cur.execute(command)
            except Exception as e:
                print(f"Command skipped: {e}: command: {command}")


def main():
    # Load the environment variables
    load_dotenv()

    # Connect to the database
    conn = None
    cur = None
    try:
        database_url = os.environ.get("DATABASE_URL")
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()

        # Execute the sql script
        sql_file = "schema.sql"
        execute_sql_script(cur, sql_file)

        # Get the path of the xml file
        xml_file = os.environ.get('DATA_SOURCE_FILE')

        if not xml_file:
            raise Exception("DATA_SOURCE_FILE environment variable not set")

        tree = et.parse(xml_file)
        root = tree.getroot()

        for entry in root:
            # Get the entry id
            entry_id = entry.find("ent_seq").text
            cur.execute("INSERT INTO entry(entry_id) VALUES (%s);", (entry_id,))

            # Get the kanji elements
            for kanji_element in entry.findall("k_ele"):
                kanji = kanji_element.find("keb").text
                kanji_info = ", ".join([info.text for info in kanji_element.findall("ke_inf")])
                if not kanji_info:
                    kanji_info = None
                cur.execute("INSERT INTO kanji_element(entry_id, kanji, kanji_info) VALUES (%s, %s, %s);",
                            (entry_id, kanji, kanji_info))

            # Get the reading elements
            for reading_element in entry.findall("r_ele"):
                reading = reading_element.find("reb").text
                reading_nokanji = reading_element.find("re_nokanji") is not None
                reading_info = ", ".join([info.text for info in reading_element.findall("re_inf")])
                if not reading_info:
                    reading_info = None
                cur.execute(
                    """INSERT INTO reading_element(entry_id, reading, reading_nokanji, reading_info) 
                    VALUES (%s, %s, %s, %s) RETURNING reading_element_id;""",
                    (entry_id, reading, reading_nokanji, reading_info))
                reading_element_id = cur.fetchone()[0]

                # Get reading restraints
                for reading_restraint in reading_element.findall("re_restr"):
                    cur.execute("INSERT INTO reading_restraint(reading_element_id, reading_restraint) VALUES (%s, %s);",
                                (reading_element_id, reading_restraint.text))

            # Get the sense elements
            for sense_element in entry.findall("sense"):
                pos = ", ".join([pos.text for pos in sense_element.findall("pos")])
                if not pos:
                    pos = None
                field = ", ".join([field.text for field in sense_element.findall("field")])
                if not field:
                    field = None
                misc = ", ".join([misc.text for misc in sense_element.findall("misc")])
                if not misc:
                    misc = None
                dialect = ", ".join([dialect.text for dialect in sense_element.findall("dial")])
                if not dialect:
                    dialect = None
                cur.execute(
                    """INSERT INTO sense(entry_id, pos, field, misc, dialect) 
                    VALUES (%s, %s, %s, %s, %s) RETURNING sense_id;""",
                    (entry_id, pos, field, misc, dialect))
                sense_id = cur.fetchone()[0]

                # Get sense kanji restriction
                for kanji_restriction in sense_element.findall("stagk"):
                    cur.execute("INSERT INTO sense_kanji_restriction(sense_id, kanji_restriction) VALUES (%s, %s);",
                                (sense_id, kanji_restriction.text))

                # Get sense reading restriction
                for reading_restriction in sense_element.findall("stagr"):
                    cur.execute("INSERT INTO sense_reading_restriction(sense_id, reading_restriction) VALUES (%s, %s);",
                                (sense_id, reading_restriction.text))

                # Get sense xref
                for xref in sense_element.findall("xref"):
                    cur.execute("INSERT INTO sense_xref(sense_id, xref) VALUES (%s, %s);",
                                (sense_id, xref.text))

                # Get sense antonym
                for antonym in sense_element.findall("ant"):
                    cur.execute("INSERT INTO sense_antonym(sense_id, antonym) VALUES (%s, %s);",
                                (sense_id, antonym.text))

                # Get sense gloss
                for gloss in sense_element.findall("gloss"):
                    cur.execute("INSERT INTO sense_gloss(sense_id, gloss) VALUES (%s, %s);",
                                (sense_id, gloss.text))

                # Get sense example
                for example in sense_element.findall("example"):
                    sense_text = example.find("ex_text").text
                    sentences = example.findall("ex_sent")
                    japanese_sentence = sentences[0].text
                    english_sentence = sentences[1].text
                    cur.execute(
                        """INSERT INTO sense_example(sense_id, sense_text, japanese_sentence, english_sentence) 
                        VALUES (%s, %s, %s, %s);""",
                        (sense_id, sense_text, japanese_sentence, english_sentence))

        conn.commit()
    except (Exception, psycopg2.Error) as error:
        print("Error while fetching data from PostgresSQL:", error)
    finally:
        # Close the connection
        if conn:
            cur.close()
            conn.close()


if __name__ == '__main__':
    main()
