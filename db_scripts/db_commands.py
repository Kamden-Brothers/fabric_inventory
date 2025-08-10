import os
from datetime import datetime

from werkzeug.utils import secure_filename

from db_scripts import connect_to_db
from db_scripts import track_images
from scripts.imageResize import createThumbnail


UPLOAD_FOLDER = './fabric_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class db_exception(Exception):
    def __init__(self, error_msg):
        self.error_msg = error_msg
        super().__init__(self.error_msg)


def _delete_image(fabric_name, ext, upload_folder):
    filename = secure_filename(fabric_name + ext)
    full_path = os.path.join(upload_folder, filename)
    if os.path.exists(full_path):
        os.remove(full_path)
    else:
        return f'Could not delete old picture at {full_path}'


def _add_entry(cursor, table, column, data):
    value_str = ', '.join('?' for _ in column)
    column_str = ', '.join(column)
    
    query_str = f'''INSERT INTO dbo.{table} ({column_str}) VALUES ({value_str})'''
    cursor.execute(query_str, data)


def _update_entry(cursor, search_id, search_column, table, column, data):
    set_str = ', '.join(f'{c}=?' for c in column)

    query_str = f'''UPDATE dbo.{table} SET {set_str} WHERE {search_column} = {search_id}'''
    cursor.execute(query_str, data)

def _update_entry_v2(cursor, table, column, data, search_str):
    set_str = ', '.join(f'{c}=?' for c in column)

    query_str = f'''UPDATE dbo.{table} SET {set_str} WHERE {search_str}'''
    print(query_str)
    cursor.execute(query_str, data)

def _delete_entry(cursor, table, column, data):
    where_str = ', '.join(f'{c}=?' for c in column)
    query_str = f'''DELETE FROM dbo.{table} WHERE {where_str}'''
    cursor.execute(query_str, data)


def _get_id(cursor, return_val, table, column, search_data, raise_ex=True, ignore_none=True):
    '''
    Passed in table and column should be hardcoded to avoid injection attack
    '''
    if ignore_none and search_data[0] is None:
        return None
    
    set_str = ' AND '.join(f'{c}=?' for c in column)
    query_str = f'''SELECT {return_val} FROM dbo.{table} WHERE {set_str}'''

    cursor.execute(query_str, search_data)
    fetch_val = (cursor.fetchone())
    if not fetch_val:
        if raise_ex:
            raise db_exception(f'Could not find {search_data=} in {table=} {column=}')
        return None
    return fetch_val[0]


def _get_multiple(cursor, return_vals, table, column, search_data, raise_ex=True, ignore_none=True):
    '''
    Passed in table and column should be hardcoded to avoid injection attack
    '''
    if ignore_none and search_data[0] is None:
        return None

    return_str = ', '.join(return_vals)

    set_str = ' AND '.join(f'{c}=?' for c in column)
    query_str = f'''SELECT {return_str} FROM dbo.{table} WHERE {set_str}'''

    cursor.execute(query_str, search_data)
    fetch_val = (cursor.fetchone())
    if not fetch_val:
        if raise_ex:
            raise db_exception(f'Could not find {search_data=} in {table=} {column=}')
        return []
    return fetch_val


def _get_ids(cursor, return_val, table, column, search_data, raise_ex=True, ignore_none=True):
    '''
    Passed in table and column should be hardcoded to avoid injection attack
    '''
    if ignore_none and search_data[0] is None:
        return None
    
    set_str = ', '.join(f'{c}=?' for c in column)
    query_str = f'''SELECT {return_val} FROM dbo.{table} WHERE {set_str}'''

    cursor.execute(query_str, search_data)
    fetch_val = (cursor.fetchall())

    if not fetch_val:
        if raise_ex:
            raise db_exception(f'Could not find {search_data=} in {table=} {column=}')
        return []
    return [val[0] for val in fetch_val]  # Return all found IDs


def _add_or_get_id(cursor, return_val, table, column, search_data, ignore_none=True):
    if ignore_none and search_data[0] is None:
        return None

    item_id = _get_id(cursor, return_val, table, column, search_data, False)
    if not item_id:
        _add_entry(cursor, table, column, search_data)
        item_id = _get_id(cursor, return_val, table, column, search_data)
    return item_id


def _check_column_exists(cursor, table, search_column):
    query_str = """SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?"""
    cursor.execute(query_str, (table, search_column))
    return bool(cursor.fetchall())


def check_table_name(name):
    '''
    Checks if table name is in list of acceptable table names
    
    Returns:
        Str: Adjusted table name
        Str: Name of id column
        Bool: True if table connection is simple. False in table connection is complex (junction table)
    '''
    id_name = name + '_id'
    if name == 'collection':
        name = 'collection_name'

    if name in ['material', 'collection_name', 'designer', 'cut', 'style', 'fabric', 'fabric_line']:
        return name, id_name, True
    elif name in ['tag', 'color']:
        return name, id_name, False
    raise db_exception('Not an acceptable table name')


class DB_Worker:
    def __init__(self):
        # Connect to database on initialization
        self.cnxn = connect_to_db.connect_to_db()
        self.upload_folder = UPLOAD_FOLDER

    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            print(f"An error occurred: {exc_val}")
            self.cnxn.rollback()
        # Always close the connection
        self.cnxn.close()

    def __del__(self):
        if hasattr(self, 'cnxn') and self.cnxn:
            try:
                self.cnxn.close()
            except:
                pass

    def current_dropdown_data(self):
        with self.cnxn.cursor() as cursor:
            data_dict = {}
            for table_name in ['collection_name', 'color', 'tag', 'designer', 'fabric_line']:
                query_str = f'''SELECT {table_name} FROM dbo.{table_name}'''
                cursor.execute(query_str)
                data_dict[table_name] = [data[0] for data in (cursor.fetchall())]

            return data_dict

    def delete_fabric(self, fabric_name):
        debug_list = []
        with self.cnxn.cursor() as cursor:
            try:
                fabric_id, image_type = _get_multiple(cursor, ['fabric_id', 'image_type'], 'fabric', ['fabric_name'], (fabric_name, ))

                _delete_entry(cursor, 'checkout_fabric', ['fabric_id'], (fabric_id, ))
                _delete_entry(cursor, 'color_junction', ['fabric_id'], (fabric_id, ))
                _delete_entry(cursor, 'tag_junction', ['fabric_id'], (fabric_id, ))
                _delete_entry(cursor, 'fabric', ['fabric_id'], (fabric_id, ))
                
                msg = _delete_image(fabric_name, image_type, self.upload_folder)
                if msg:
                    debug_list.append(msg)

                # Commit the transaction
                self.cnxn.commit()
            except Exception as e:
                print(e)
                self.cnxn.rollback()  # Roll back on error
                raise e  # Re-raise the exception for handling further up
        return ', '.join(debug_list)

    def delete_linked_item(self):
        '''
        Delete Color or Tag entry and all connections to it
        '''

    def get_linked_collection(self, cursor, fabric_id, table_name):
        '''
        Get all Colors or Tags linked to a main item
        
        Args:
            fabric_id (int): Item's ID to get linked connections
            table_name (str): Connecting table (Junction table should be formatted {table_name}_junction)
        '''


        query_str = f'''SELECT {table_name}.{table_name}_id, {table_name}.{table_name}
                        FROM dbo.{table_name}_junction as junc
                        LEFT JOIN dbo.{table_name} ON {table_name}.{table_name}_id = junc.{table_name}_id
                        WHERE junc.fabric_id = ?'''

        cursor.execute(query_str, fabric_id)
        fetch_val = (cursor.fetchall())
        return fetch_val

    def update_linked_collection(self, cursor, fabric_id, table_name, data):
        old_tags = self.get_linked_collection(cursor, (fabric_id,), table_name)

        remove_item_ids = [item_info[0] for item_info in old_tags if item_info[1] not in data[table_name]]
        old_item_names = [item_info[1] for item_info in old_tags]
        add_items = [tag for tag in data[table_name] if tag not in old_item_names]

        for item_id in remove_item_ids:
            _delete_entry(cursor, f'{table_name}_junction', [f'{table_name}_id'], (item_id,))

        for item_name in add_items:
            item_id = _get_id(cursor, f'{table_name}_id', table_name, [table_name], (item_name,))

            _add_entry(cursor, f'{table_name}_junction', ['fabric_id', f'{table_name}_id'], (fabric_id, item_id))

    def get_column_connections(self, column, value, passed_in_cursor=None):
        '''Get number of connections to a entry in connecte table'''
        column, id_name, simple = check_table_name(column)

        with passed_in_cursor or self.cnxn.cursor() as cursor:
            if simple:
                column_id = _get_id(cursor, id_name, column, [column], (value,))
                connected_fabrics = _get_ids(cursor, 'fabric_id', 'fabric', [id_name], (column_id,), raise_ex=False)

            else:
                column_id = _get_id(cursor, id_name, column, [column], (value,))
                connected_fabrics = _get_ids(cursor, 'fabric_id', f'{column}_junction', [id_name], (column_id,), raise_ex=False)

        return connected_fabrics, column_id

    def delete_column_value(self, column, value):
        '''Delete value in connected table and all connections to it'''
        with self.cnxn.cursor() as cursor:
            try:
                connected_fabrics, column_id = self.get_column_connections(column, value, cursor)
                column, id_name, simple = check_table_name(column)

                if simple:
                    for fabric_id in connected_fabrics:
                        _update_entry(cursor, fabric_id, 'fabric_id', 'fabric', [id_name], (None,))
                else:
                    _delete_entry(cursor, f'{column}_junction', [id_name], (column_id,))

                _delete_entry(cursor, column, [id_name], (column_id,))
                self.cnxn.commit()
            except Exception as e:
                self.cnxn.rollback()
                raise e

    def select_fabric(self, fabric_name):
        with self.cnxn.cursor() as cursor:
            fabric_id = _get_id(cursor, 'fabric_id', 'fabric', ['fabric_name'], (fabric_name,), False)
            return fabric_id
        
    def checkout_fabrics(self, fabric_ids, name):
        if (not fabric_ids or not name):
            raise db_exception('name and fabrics cannot be blank')
        
        with self.cnxn.cursor() as cursor:
            try:
                for fabric_id in fabric_ids:
                    if (not fabric_id):
                        raise db_exception('Invalid fabric_id given')
                    
                    _add_entry(cursor, 'checkout_fabric', ['fabric_id', 'person', 'checked_out'], (fabric_id, name, 1))
                self.cnxn.commit()
            except Exception as e:
                self.cnxn.rollback()
                raise e

    def check_in_fabric(self, fabric_id):
        fabric_id = int(fabric_id)
        if (not fabric_id or fabric_id == 0):
            raise db_exception('Fabrics cannot be blank')
        
        with self.cnxn.cursor() as cursor:
            try:
                check_in_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                _update_entry_v2(cursor, 'checkout_fabric', ['checked_out', 'check_in_date'], (0, check_in_date), f'fabric_id = {fabric_id} AND checked_out = 1')
                self.cnxn.commit()
            except Exception as e:
                self.cnxn.rollback()
                raise e


    def add_fabric(self, data, image_file):
        old_fabric = data['old_fabric']
        old_ext = data['old_ext']
        data['quantity'] = int(data['quantity'])
        debug_list = []
        delete_image = False

        ext = data['ext'].lower()
        if (ext != '.jpeg' and ext != '.jpg' and ext != '.png'):
            raise db_exception('Picture ext must be .jpeg, .jpg, or .png')

        with self.cnxn.cursor() as cursor:
            try:
                # Retrieve IDs for connected tables
                material_id = _get_id(cursor, 'material_id', 'material', ['material'], (data['material'],))
                cut_id = _get_id(cursor, 'cut_id', 'cut', ['cut'], (data['cut'],))
                style_id = _get_id(cursor, 'style_id', 'style', ['style'], (data['style'],))
                
                # Retrieve IDs and/or add new data for connected tables
                collection_id = _add_or_get_id(cursor, 'collection_id', 'collection_name', ['collection_name'], (data['collection'],))
                designer_id = _add_or_get_id(cursor, 'designer_id', 'designer', ['designer'], (data['designer'],))
                fabric_line_id = _add_or_get_id(cursor, 'fabric_line_id', 'fabric_line', ['fabric_line'], (data['fabric_line'],))
                rack_id = _add_or_get_id(cursor, 'rack_id', 'rack', ['rack_id'], (data['rack'],))
                stack_id = _add_or_get_id(cursor, 'stack_id', 'stack', ['stack_id'], (data['stack'],))

                # Process colors and tags
                color_ids = [_add_or_get_id(cursor, 'color_id', 'color', ['color'], (color,)) for color in data['color']]
                tag_ids = [_add_or_get_id(cursor, 'tag_id', 'tag', ['tag'], (tag,)) for tag in data['tag']]
                
                if old_fabric:
                    # Update existing fabric
                    fabric_id = _get_id(cursor, 'fabric_id', 'fabric', ['fabric_name'], (old_fabric,))


                    update_cols = ['fabric_name', 'material_id', 'designer_id', 'fabric_line_id',
                                   'width', 'yardage', 'cut_id', 'style_id', 'rack_id', 'stack_id', 'image_type',
                                   'collection_id', 'real_name', 'quantity']
                    update_vals = (data['name'], material_id, designer_id, fabric_line_id,
                                   data['width'], data['yardage'], cut_id, style_id, rack_id, stack_id, data['ext'],
                                   collection_id, data['real_name'], data['quantity'])
                    _update_entry(cursor, fabric_id, 'fabric_id', 'fabric', update_cols, update_vals)

                    self.update_linked_collection(cursor, fabric_id, 'tag', data)
                    self.update_linked_collection(cursor, fabric_id, 'color', data)
                    if old_fabric != data['name'] or old_ext != data['ext']:
                        delete_image = True

                else:
                    # Check for existing fabric
                    fabric_id = _get_id(cursor, 'fabric_id', 'fabric', ['fabric_name'], (data['name'],), False)
                    if fabric_id:
                        raise db_exception('Name already exists')

                    # Insert new fabric entry
                    _add_entry(cursor, 'fabric',
                               ['fabric_name', 'material_id', 'designer_id', 'fabric_line_id', 
                                'width', 'yardage', 'cut_id', 'style_id', 'rack_id', 'stack_id', 'image_type', 'collection_id', 'real_name', 'quantity'],
                               (data['name'], material_id, designer_id, fabric_line_id,
                                data['width'], data['yardage'], cut_id, style_id, rack_id, stack_id, data['ext'], collection_id, data['real_name'], data['quantity']))

                    # Get the newly created fabric ID
                    fabric_id = _get_id(cursor, 'fabric_id', 'fabric', ['fabric_name'], (data['name'],))

                    # Connect colors and tags to the new fabric entry
                    for color_id in color_ids:
                        _add_entry(cursor, 'color_junction', ['fabric_id', 'color_id'], (fabric_id, color_id))
                    for tag_id in tag_ids:
                        _add_entry(cursor, 'tag_junction', ['fabric_id', 'tag_id'], (fabric_id, tag_id))

                # Save image
                filename = data['name'] + data['ext']
                filename = secure_filename(filename)
                image_file.save(os.path.join(self.upload_folder, filename))

                try:
                    createThumbnail(filename)
                except Exception as e:
                    debug_list.append('Failed to create thumbnail')

                if delete_image:
                    msg = _delete_image(old_fabric, old_ext, self.upload_folder)
                    if msg:
                        debug_list.append(msg)

                # Add image name to list of images that need backed up
                error_msg = track_images.update_image_list(filename)
                if error_msg:
                    debug_list.append(error_msg)

                # Commit the transaction
                self.cnxn.commit()
            except Exception as e:
                self.cnxn.rollback()  # Roll back on error
                raise e  # Re-raise the exception for handling further up
            return ', '.join(debug_list)
        
    def get_all_fabric_names(self):
        with self.cnxn.cursor() as cursor:
            query_str = '''SELECT f.fabric_id, fabric_name
                           FROM dbo.fabric f'''
            cursor.execute(query_str)
            fabric_data = (cursor.fetchall())
            return [{'fabric_id': val[0], 'fabric_name': val[1]} for val in fabric_data]

    def get_fabric_by_name(self, fabric_name):
        with connect_to_db.connect_to_db() as cnxn:
            with cnxn.cursor() as cursor:
                query_str = '''
                    SELECT f.fabric_id, fabric_name, material, designer, fabric_line, width, yardage, cut, style, rack_id, stack_id, image_type, collection_name, real_name, cf.checked_out, quantity
                    FROM dbo.fabric f
                    LEFT JOIN dbo.material m ON m.material_id = f.material_id
                    LEFT JOIN dbo.designer d ON d.designer_id = f.designer_id
                    LEFT JOIN dbo.collection_name cn ON cn.collection_id = f.collection_id
                    LEFT JOIN dbo.fabric_line f_l ON f_l.fabric_line_id = f.fabric_line_id
                    LEFT JOIN dbo.cut c ON c.cut_id = f.cut_id
                    LEFT JOIN dbo.style s ON s.style_id = f.style_id
                    LEFT JOIN (
                        SELECT fabric_id, MAX(CAST(checked_out AS INT)) AS checked_out
                        FROM dbo.checkout_fabric
                        GROUP BY fabric_id
                    ) cf ON cf.fabric_id = f.fabric_id
                    WHERE fabric_name = ?
                '''
                cursor.execute(query_str, (fabric_name,))
                fabric_data = cursor.fetchone()
                if not fabric_data:
                    return None

                fabric = {}
                fabric['fabric_id'] = fabric_data[0]
                fabric['fabric_name'] = fabric_data[1]
                fabric['material'] = fabric_data[2]
                fabric['designer'] = fabric_data[3]
                fabric['fabric_line'] = fabric_data[4]
                fabric['width'] = fabric_data[5]
                fabric['yardage'] = fabric_data[6]
                fabric['cut'] = fabric_data[7]
                fabric['style'] = fabric_data[8]
                fabric['rack_id'] = fabric_data[9]
                fabric['stack_id'] = fabric_data[10]
                fabric['image_type'] = fabric_data[11]
                fabric['collection'] = fabric_data[12]
                fabric['real_name'] = fabric_data[13]
                fabric['image_path'] = secure_filename(fabric['fabric_name'] + fabric['image_type'])
                fabric['checked_out'] = bool(fabric_data[14])
                fabric['quantity'] = fabric_data[15] if fabric_data[15] else 1

                # Get colors
                query_colors = '''
                    SELECT color FROM dbo.color c
                    JOIN dbo.color_junction cj ON cj.color_id = c.color_id
                    WHERE cj.fabric_id = ?
                '''
                cursor.execute(query_colors, (fabric['fabric_id'],))
                fabric['color'] = [c[0] for c in cursor.fetchall()]

                # Get tags
                query_tags = '''
                    SELECT tag FROM dbo.tag t
                    JOIN dbo.tag_junction tj ON tj.tag_id = t.tag_id
                    WHERE tj.fabric_id = ?
                '''
                cursor.execute(query_tags, (fabric['fabric_id'],))
                fabric['tag'] = [t[0] for t in cursor.fetchall()]

                return fabric

    def get_all_data(self):
        all_fabrics = []
        with connect_to_db.connect_to_db() as cnxn:
            with cnxn.cursor() as cursor:
                query_str = '''SELECT f.fabric_id, fabric_name, material, designer, fabric_line, width, yardage, cut, style, rack_id, stack_id, image_type, collection_name, real_name, cf.checked_out, quantity
                            FROM dbo.fabric f
                            LEFT JOIN dbo.material m ON m.material_id = f.material_id
                            LEFT JOIN dbo.designer d ON d.designer_id = f.designer_id
                            LEFT JOIN dbo.collection_name cn ON cn.collection_id = f.collection_id
                            LEFT JOIN dbo.fabric_line f_l ON f_l.fabric_line_id = f.fabric_line_id
                            LEFT JOIN dbo.cut c ON c.cut_id = f.cut_id
                            LEFT JOIN dbo.style s ON s.style_id = f.style_id
                            LEFT JOIN (
                                    SELECT fabric_id, MAX(CAST(checked_out AS INT)) AS checked_out
                                    FROM dbo.checkout_fabric
                                    GROUP BY fabric_id
                                ) cf ON cf.fabric_id = f.fabric_id'''

                cursor.execute(query_str)
                fetch_val = (cursor.fetchall())
                
                
                for fabric_data in fetch_val:
                    fabric = {}
                    fabric['fabric_id'] = fabric_data[0]
                    fabric['fabric_name'] = fabric_data[1]
                    fabric['material'] = fabric_data[2]
                    fabric['designer'] = fabric_data[3]
                    fabric['fabric_line'] = fabric_data[4]
                    fabric['width'] = fabric_data[5]
                    fabric['yardage'] = fabric_data[6]
                    fabric['cut'] = fabric_data[7]
                    fabric['style'] = fabric_data[8]
                    fabric['rack_id'] = fabric_data[9]
                    fabric['stack_id'] = fabric_data[10]
                    fabric['image_type'] = fabric_data[11]
                    fabric['collection'] = fabric_data[12]
                    fabric['real_name'] = fabric_data[13]
                    fabric['image_path'] = filename = secure_filename(fabric['fabric_name'] + fabric['image_type'])
                    fabric['checked_out'] = bool(fabric_data[14])
                    fabric['quantity'] = fabric_data[15] if fabric_data[15] else 1

                    all_fabrics.append(fabric)

                for fabric in all_fabrics:
                    query_str = f'''SELECT color FROM dbo.color c
                                    JOIN dbo.color_junction cj ON cj.color_id = c.color_id
                                    WHERE cj.fabric_id = {fabric['fabric_id']}'''
                    cursor.execute(query_str)
                    fetch_val = (cursor.fetchall())
                    fabric['color'] = [c[0] for c in fetch_val]
                
                    query_str = f'''SELECT tag FROM dbo.tag t
                                    JOIN dbo.tag_junction tj ON tj.tag_id = t.tag_id
                                    WHERE tj.fabric_id = {fabric['fabric_id']}'''
                                    
                    cursor.execute(query_str)
                    fetch_val = (cursor.fetchall())
                    fabric['tag'] = [c[0] for c in fetch_val]
                    
            return all_fabrics


if __name__ == '__main__':
    worker = DB_Worker()
    worker.delete_fabric('Test Add Update')
