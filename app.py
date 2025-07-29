import webbrowser
import socket
import logging

from flask import Flask, render_template, request, send_from_directory

from db_scripts.db_commands import DB_Worker, db_exception
from db_scripts.update_database import run_update_scripts


# Update Database with any new update scripts
run_update_scripts()

# Create instance of database worker
db_worker = DB_Worker()

all_fabric_data = db_worker.get_all_data()

# Set path for log
logging.basicConfig(filename='record.log', level=logging.DEBUG)
app = Flask(__name__, template_folder='./templates', static_folder='./static')

@app.route('/')
@app.route('/add_inventory')
def add_inventory():
    return render_template("add_inventory.html")

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
        app.logger.error(str(e))
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        app.logger.error(str(e))
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}


@app.route('/delete_data', methods=['POST'])
def delete_data():
    print('delete_data')
    data = request.get_json()
    list_name = data.get('list_name')
    text_value = data.get('text_value')

    try:
        db_worker.delete_column_value(list_name, text_value)
    
        global all_fabric_data
        all_fabric_data = db_worker.get_all_data()
        return {'result': True}
    except db_exception as e:
        app.logger.error(str(e))
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        app.logger.error(str(e))
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}

@app.route('/get_specific_fabric')
def get_specific_fabric():
    fabric_name = request.args.get('fabric')
    print(fabric_name)
    for fabric in all_fabric_data:
        if fabric_name == fabric['fabric_name']:
            return fabric
    print('Fabric not found')
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
        app.logger.error(str(e))
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        app.logger.error(str(e))
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}
    return {'result': True, 'debug_msg': debug_msg}

@app.route('/submit_collection', methods=['POST'])
def submit_collection():
    '''
    Submit a Fabric to the database.
    '''
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
    
    app.logger.debug(f'Adding fabric to database {data_dict}')
    try:
        debug_msg = db_worker.add_fabric(data_dict, image_file)

        # Update data
        global all_fabric_data
        
        if debug_msg:
            app.logger.warning(f'Saved fabric with error. {debug_msg=}')
        else:
            app.logger.debug(f'Saved fabric successfully')
        all_fabric_data = db_worker.get_all_data()
    except db_exception as e:
        app.logger.error(f"Error Saving fabric: {e}")
        print(e)
        return {'result': False, 'error_msg': e.error_msg}
    except Exception as e:
        print(e)
        app.logger.error(f"Code Error When Saving fabric: {e}")
        return {'result': False, 'error_msg': 'Code Error: ' + str(e)}

    return {'result': True, 'debug_msg': debug_msg}

@app.route('/ip_address')
def get_ip_address():
    return 'http//:' + socket.gethostbyname(socket.gethostname()) + ':5000'

if __name__=='__main__':
    webbrowser.open('http://127.0.0.1:5000/view_inventory')
    app.run(host='0.0.0.0', port=5000)
