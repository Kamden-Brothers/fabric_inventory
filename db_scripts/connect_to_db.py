import json

import pyodbc

def connect_to_db(autocommit=False, test=False):
    try:
        with open('credentials.json', 'r') as file:
            data = json.load(file)

        server_name = data['server_name']
        if test:
            db = data['test_db']
        else:
            db = data['db']
    except Exception as e:
        print('Error loading credentials')
        raise e

    return pyodbc.connect(
            driver='{ODBC Driver 17 for SQL Server}',
            server=f'{server_name}', 
            database=f'{db}', 
            trusted_connection='yes',
            autocommit=autocommit
        )
