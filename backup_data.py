'''

'''
import os
import json
import shutil
from datetime import datetime

import pyodbc

from db_scripts import connect_to_db

try:
    with open('credentials.json', 'r') as file:
        data = json.load(file)
        backup_path = data['backup_path']
except Exception as e:
    print('Could not find "backup_path" in "credentials.json"')
    raise e

backup_image_path = f'{backup_path}/fabric_uploads'
local_images = os.listdir('fabric_uploads')
backed_up_images = os.listdir(backup_image_path)
print(backed_up_images)
print(local_images)

add_images = [i for i in local_images if i not in backed_up_images]
remove_images = [i for i in backed_up_images if i not in local_images]

print()
print(f'{add_images = }')
print(f'{remove_images = }')

for image_name in add_images:
    shutil.copy(f'fabric_uploads/{image_name}', f'{backup_image_path}/{image_name}')


cnxn = connect_to_db.connect_to_db()

# Backup path
backup_file_path = r'C:\Users\kamde\PythonScripts\fabric_inventory\backup\fabric_inventory.bak'
print(backup_file_path)

backup = f"BACKUP DATABASE fabric_inventory TO DISK = '{backup_file_path}'"
print(backup)
cursor = cnxn.cursor().execute(backup)
while cursor.nextset():
    pass

cnxn.close()

# Format it as YYYYMMDDHHMM
current_date = datetime.now().strftime("%Y%m%d%H%M")

print(f'{backup_path}fabric_inventory_{current_date}.bak')
shutil.move(backup_file_path, f'{backup_path}/fabric_inventory_{current_date}.bak')
