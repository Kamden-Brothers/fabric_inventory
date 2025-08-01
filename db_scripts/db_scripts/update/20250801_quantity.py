

# Database Update Script
from db_scripts import connect_to_db

update_message = 'Add quantity column to database'

query_str_1 = '''ALTER TABLE dbo.fabric
ADD quantity INT DEFAULT 1;'''

query_str_2 = '''UPDATE dbo.fabric 
SET quantity=1;
'''

def update_script():
	cnxn = connect_to_db.connect_to_db()
	with cnxn.cursor() as cur:
		try:
			print(update_message)
			cur.execute(query_str_1)
			cur.execute(query_str_2)
			cnxn.commit()
		except:
			cnxn.rollback()
			raise

