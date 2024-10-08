'''

'''
import os
import re
import json
import shutil
import traceback
from datetime import datetime

import pyodbc

from db_scripts import connect_to_db
from db_scripts import track_images


def get_backup_path():
    try:
        with open('credentials.json', 'r') as file:
            data = json.load(file)
            return data['backup_path']
    except Exception as e:
        print('Could not find "backup_path" in "credentials.json"')
        raise e


def copy_images(backup_path):
    '''
    Saves images to backup_path (ex: The one drive)
    Uses track_images to update images already uploaded to the onedrive
    Deletes images removed
    '''
    backup_image_path = f'{backup_path}/fabric_uploads'
    local_images = os.listdir('fabric_uploads')
    backed_up_images = os.listdir(backup_image_path)
    print(f'local_images = {len(local_images)}')
    print(f'backed_up_images = {len(backed_up_images)}')

    # Images that have been updated
    updated_image_list = track_images.get_image_list()
    print(f'updated_image_list = {len(updated_image_list)}')

    # Get list of up to data backed up images
    current_backed_up = [i for i in backed_up_images if i not in updated_image_list]

    # Images to be added
    add_images = [i for i in local_images if i not in current_backed_up]

    # Images to remove from backup
    remove_images = [i for i in backed_up_images if i not in local_images]

    print(f'{add_images = }')
    print(f'{remove_images = }')

    # Update backed up images
    for image_name in add_images:
        shutil.copy(f'fabric_uploads/{image_name}', f'{backup_image_path}/{image_name}')

    # Delete removed images
    for image_name in remove_images:
        os.remove(f'{backup_image_path}/{image_name}')

    # All updated images have been addressed. Delete update tracking file.
    track_images.delete_csv()


def backup_db(backup_path):
    '''
    Back up current data to the one drive with current timestamp
    Saves locally and then moves it to onedrive
    DB Service needs permissions to local backup folder
    Deletes all but the last 3 backups
    '''
    # Backup Path
    backup_file_path = os.getcwd() + r'\backup\fabric_inventory.bak'
    # Backup Command
    backup = f"BACKUP DATABASE fabric_inventory TO DISK = '{backup_file_path}'"

    with connect_to_db.connect_to_db() as cnxn:
        cursor = cnxn.cursor()
        cursor.execute(backup)
        # Iterate through output
        while cursor.nextset():
            pass

    # Format it as YYYYMMDDHHMM
    current_date = datetime.now().strftime("%Y%m%d%H%M")

    # Move backup file to backup folder
    backup_filename = f'{backup_path}/fabric_inventory_{current_date}.bak'
    shutil.move(backup_file_path, backup_filename)

    backup_info = []

    current_backups = os.listdir(f'{backup_path}/')
    for backup in current_backups:
        backup_re = re.search(r'fabric_inventory_((\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d))\.bak', backup)
        if backup_re:
            backup_groups = backup_re.groups()

            us_date_str = f'{backup_groups[2]}-{backup_groups[3]}-{backup_groups[1]} at {backup_groups[4]}:{backup_groups[5]}'
            ('202410081054', '2024', '10', '08', '1054')
            backup_info.append({'name': backup_re.group(), 'date': backup_groups[0], 'us_date': us_date_str})


    print(f'{len(backup_info)} backups found')
    print('Keeping last 3. Deleting the rest')

    print(f'Keeping backups on day {[i["us_date"] for i in backup_info][-3:]}')
    print(f'Deleting backups on day {[i["us_date"] for i in backup_info][:-3]}')
    
    for backup in backup_info[:-3]:
        os.remove(f'{backup_path}/{backup["name"]}')


if __name__ == '__main__':
    backup_path = get_backup_path()

    try:
        copy_images(backup_path)
    except Exception as e:
        print(traceback.format_exc())
        print('FAILED TO BACKUP IMAGES')

    try:
        backup_db(backup_path)
    except Exception as e:
        print(traceback.format_exc())
        print('FAILED TO BACKUP DATABASE')
