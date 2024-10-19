import webbrowser
import csv
import os
import re

import pandas as pd
from flask import Flask, render_template, request, url_for, send_from_directory
from werkzeug.utils import secure_filename


from db_scripts.db_commands import DB_Worker
from db_scripts.db_commands import db_exception
db_worker = DB_Worker()
all_fabric_data = db_worker.get_all_data()
import pprint
pprint.pprint(all_fabric_data)

app = Flask(__name__, template_folder='./templates', static_folder='./static')

@app.route('/')
@app.route('/add_inventory')
def add_inventory():
    return render_template("add_inventory.html")

@app.route('/testing')
def testing():
    return render_template("testing.html")

@app.route('/fabric_uploads/<path:filename>')
def upload_file(filename):
    return send_from_directory('fabric_uploads', filename)

@app.route('/view_inventory')
def view_inventroy():
    return render_template("view_inventory.html")

@app.route('/current_fabric_data')
def current_fabric_data():
    return all_fabric_data

@app.route('/current_data')
def current_data():
    return db_worker.current_dropdown_data()

@app.route('/all_fabric_names')
def all_fabric_names():
    return [d['fabric_name'] for d in all_fabric_data]

@app.route('/connected_items', methods=['POST'])
def connected_items():
    data = request.get_json()
    list_name = data.get('list_name')
    text_value = data.get('text_value')
    try:
        connections, _ = db_worker.get_column_connections(list_name, text_value)
        return {'result': True, 'connections': len(connections)}
    except db_exception as e:
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}


@app.route('/delete_data', methods=['POST'])
def delete_data():
    data = request.get_json()
    list_name = data.get('list_name')
    text_value = data.get('text_value')
    db_worker.delete_column_value(list_name, text_value)
    
    global all_fabric_data
    all_fabric_data = db_worker.get_all_data()
    try:
        return {'result': True}
    except db_exception as e:
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}

@app.route('/get_specific_fabric')
def get_specific_fabric():
    fabric_name = request.args.get('fabric')
    for fabric in all_fabric_data:
        if fabric_name == fabric['fabric_name']:
            return fabric
    return {'error_msg': 'Fabric not found'}

@app.route('/delete_fabric', methods=['POST'])
def delete_fabric():
    try:
        data_dict = request.form.to_dict()
        print(data_dict)
        debug_msg = db_worker.delete_fabric(data_dict['name'])
    
        # Update data
        global all_fabric_data
        all_fabric_data = db_worker.get_all_data()
    except db_exception as e:
        print(e)
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        print(e)
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}
    return {'result': True, 'debug_msg': debug_msg}

@app.route('/submit_collection', methods=['POST'])
def submit_collection():
    data_dict = request.form.to_dict()

    data_dict = {
        key: (None if value == '' or value.lower() == 'null' else value) 
        for key, value in data_dict.items()
    }
    data_dict['color'] = request.form.getlist('color')
    data_dict['tag'] = request.form.getlist('tag')

    if 'image' in request.files:
        image_file = request.files['image']
    else:
        return {'result': False, 'error_msg': 'Image name not acceptable'}


    import pprint
    pprint.pprint(data_dict)
    if data_dict['color'] is None:
        data_dict['color'] = []
    if data_dict['tag'] is None:
        data_dict['tag'] = []
    
    try:
        debug_msg = db_worker.add_fabric(data_dict, image_file)

        # Update data
        global all_fabric_data
        all_fabric_data = db_worker.get_all_data()
    except db_exception as e:
        print(e)
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        print(e)
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}

    return {'result': True, 'debug_msg': debug_msg}

if __name__=='__main__':
    webbrowser.open('http://127.0.0.1:5000')
    app.run(host='0.0.0.0', port=5000)