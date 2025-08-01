import json

import pyodbc

def connect_to_db(autocommit=False):
    try:
        with open('credentials.json', 'r') as file:
            data = json.load(file)

        server_name = data['server_name']
        db = data['db']

    except Exception as e:
        print('Error loading credentials')
        raise e
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server_name};"
        f"DATABASE={db};"
        f"Trusted_Connection=yes;"
        "MultipleActiveResultSets=True;"
    )

    return pyodbc.connect(conn_str, autocommit=autocommit)
    # return pyodbc.connect(
    #         driver='{ODBC Driver 17 for SQL Server}',
    #         server=f'{server_name}', 
    #         database=f'{db}', 
    #         trusted_connection='yes',
    #         autocommit=autocommit,
    #         MARS_Connection='Yes'
    #     )
