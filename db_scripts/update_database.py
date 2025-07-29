from os import listdir, path
import importlib
import shutil

base_path = './db_scripts/db_scripts'

def import_module_from_file(module_name, file_path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def run_update_scripts():
    update_scripts = [f for f in listdir(path.join(base_path, 'update')) if f.endswith('.py')]
    archived_scripts = [f for f in listdir(path.join(base_path, 'update_archive')) if f.endswith('.py')]

    new_scripts = [script for script in update_scripts if script not in archived_scripts]

    for file_name in new_scripts:

        module_path = path.join(base_path, 'update', file_name)
        archive_name = path.join(base_path, 'update_archive', file_name)
        shutil.copy(module_path, archive_name)

        module_name = file_name[:-3]
        db_update_script = import_module_from_file(module_name, module_path)

        if hasattr(db_update_script, 'update_script'):
            db_update_script.update_script()
        else:
            print(f"No 'update_script' function in {file_name}")

