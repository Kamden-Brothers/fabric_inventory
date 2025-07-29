# Database Update Script
from db_scripts import connect_to_db

update_message = 'Adding Jelly Roll to style list'

query_str = '''
INSERT INTO dbo.style
	(style)
VALUES
	('Jelly Roll');
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

