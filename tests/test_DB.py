
from werkzeug.datastructures import FileStorage

from db_scripts.db_commands import DB_Worker

file_image = FileStorage(open('tests/test_resources/Tis_The_Season_420.jpeg', 'rb'))

fabric_1 = {
    'name': 'Tis The Season 420',
    'material': 'Cotton',
    'designer': None,
    'fabric_line': 'Fabri-Quilt',
    'width': 42,
    'yardage': 1.5,
    'cut': 'Uncut',
    'style': 'Flat Fold',
    'rack': 2,
    'stack': 3,
    'collection': None,
    'real_name': True,
    'ext': '.jpeg',
    'color': ['White', 'Blue'],
    'tag': ['Christmas', 'Words', 'Ho Ho Ho'],
    'old_fabric': None,
    'old_ext': None
}

fabric_2 = {
    'name': 'A Year To Crow About 23085',
    'collection': None,
    'designer': 'Jacqueline Paton',
    'fabric_line': 'Red Rooster Fabrics',
    'selvage': None,
    'width': '44.00',
    'yardage': '1.89',
    'rack': '2',
    'stack': '1',
    'color': ['Beige', 'Tan', 'Mustard'],
    'tag': ['Star', 'Washed'],
    'ext': '.jpeg',
    'material': 'Cotton',
    'cut': 'Multiple Pieces',
    'style': 'Flat Fold',
    'real_name': 'true',
    'old_fabric': None,
    'old_ext': None
    # 'old_fabric': 'A Year To Crow About 23085',
    # 'old_ext': '.jpeg'
}

def add_fabric():
    with DB_Worker(test=True) as db_worker:
        try:
            if db_worker.number_of_fabric() != 0:
                return 'Database did not start empty'
            db_worker.add_fabric(fabric_1, file_image)
            if db_worker.number_of_fabric() != 1:
                return 'Fabric was not added to database'
        except Exception as e:
            return e.error_msg
    return ''

def select_fabric():
    with DB_Worker(test=True) as db_worker:
        try:
            if db_worker.number_of_fabric() != 0:
                return 'Database did not start empty'
            db_worker.add_fabric(fabric_1, file_image)

            if db_worker.number_of_fabric() != 1:
                return 'Fabric was not added to database'

            if not db_worker.select_fabric(fabric_1['name']):
                return 'Added fabric could not be found'

        except Exception as e:
            print(e)
            return e.error_msg
    return ''


def remove_fabric():
    with DB_Worker(test=True) as db_worker:
        try:
            if db_worker.number_of_fabric() != 0:
                return 'Database did not start empty'

            db_worker.add_fabric(fabric_1, file_image)
            
            if db_worker.number_of_fabric() != 1:
                return 'Fabric was not added to database'

            db_worker.delete_fabric(fabric_1['name'])
            try:
                db_worker.select_fabric(fabric_1['name'])
            except Exception as e:
                print(e)
                db_worker.number_of_fabric()
                
        except Exception as e:
            db_worker.cnxn.rollback()
            print(e)


def clear_database():
    with DB_Worker(test=True) as db_worker:
        try:
            with db_worker.cnxn.cursor() as cursor:
                query_str = '''
                    DELETE FROM fabric_inventory_test.dbo.color_junction;
                    DELETE FROM fabric_inventory_test.dbo.tag_junction;
                    DELETE FROM fabric_inventory_test.dbo.fabric;
                    DELETE FROM fabric_inventory_test.dbo.color;
                    DELETE FROM fabric_inventory_test.dbo.tag;
                    DELETE FROM fabric_inventory_test.dbo.fabric_line;
                    DELETE FROM fabric_inventory_test.dbo.rack;
                    DELETE FROM fabric_inventory_test.dbo.stack;
                '''
                cursor.execute(query_str)
        except Exception as e:
            print(e)
            db_worker.cnxn.rollback()
            return False

        db_worker.cnxn.commit()
        return True


def run_test(test_function, test_name):
    clear_database()
    error = test_function()
    if error:
        print(f'{test_name} failed with error message {error}')
    print(f'{test_name} Passed')


def run_tests():
    run_test(add_fabric, 'add_fabric')
    run_test(select_fabric, 'select_fabric')
    run_test(remove_fabric, 'remove_fabric')
