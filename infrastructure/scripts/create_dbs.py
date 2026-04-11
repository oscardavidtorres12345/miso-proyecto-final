import psycopg

PASS = "TravelHub2024" + chr(33) + "Secure"  # avoid shell expansion issues

c = psycopg.connect(
    host="travelhub-dev-postgres.cql4kouiikp3.us-east-1.rds.amazonaws.com",
    port=5432,
    dbname="postgres",
    user="travelhub",
    password=PASS,
)
c.autocommit = True
cur = c.cursor()
cur.execute("SELECT datname FROM pg_database")
existing = [r[0] for r in cur.fetchall()]
print("Existing DBs:", existing)

for db in ["identity_db", "booking_db", "search_db", "payment_db"]:
    if db not in existing:
        cur.execute("CREATE DATABASE " + db)
        print("CREATED:", db)
    else:
        print("OK (exists):", db)

c.close()
print("Done!")
