import os
import csv

from modules import ListUtility


change_list_path = 'updated_images.csv'
def delete_csv():
    if os.path.exists(change_list_path):
        os.remove(change_list_path)


def get_image_list():
    '''
    Get list of current image names in updated_images
    '''
    updated_images = []
    if os.path.exists(change_list_path):
        with open(change_list_path, mode='r', newline='') as csvfile:
            csv_reader = csv.reader(csvfile)

            for row in csv_reader:
                # First row has all the data
                return row
    return []


def update_image_list(image_name):
    '''
    Add new item to updated_images.csv
    
    Args:
        str: Image being added
    
    Return:
        str: Error message
    '''
    try:
        updated_images = get_image_list()
        if ListUtility.add_unique_entry(updated_images, image_name):
            # Save if new item is added

            # Open the CSV file for writing
            with open(change_list_path, mode='w', newline='') as csvfile:
                csv_writer = csv.writer(csvfile)
                
                # Write the list as a single row
                csv_writer.writerow(updated_images)
        print(get_image_list())
    except Exception as e:
        print('Could not update list of images to backup:', e)
        return f'Could not update list of images to backup: {e}'
