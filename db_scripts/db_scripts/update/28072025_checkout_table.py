

# Database Update Script
from db_scripts import connect_to_db

update_message = 'Adding checkout table'

query_str = '''
CREATE TABLE dbo.checkout_fabric (
    checkout_id INT IDENTITY(1,1) PRIMARY KEY,
    fabric_id INT,
    person VARCHAR(60) NOT NULL,
	checked_out bit,
    checkout_date DATE DEFAULT GETDATE(),
	check_in_date DATE DEFAULT NULL,
    FOREIGN KEY (fabric_id) REFERENCES dbo.fabric(fabric_id)
);
'''

def update_script():
	cnxn = connect_to_db.connect_to_db()
	with cnxn.cursor() as cur:
		try:
			print(update_message)
			cur.execute(query_str)
			cnxn.commit()
		except:
			cnxn.rollback()
			raise

