Work In Progress
Local Website to Store fabric inventory

Tools Used
- SQL Server
- Python (flask, pyodbc)
- HTML, CSS
- JavaScript (JQuery, Bootstrap)

Data is entered through a webpage created by HTML and JavaScript

Python uses flask to host server and uses pyodbc to connect to SQL Server

Setup
- Download and set up Python Environment (requirements.txt)
- Download SQL Server and setup database using db_scripts/db_scripts/create.sql
- Create credentials.json with database information (User through "SQL Server Authentication". connect_to_db.py could be updated to use windows authentication if wanted)
{
  "driver": "ODBC Driver 17 for SQL Server",
  "server_name": "computer_name",
  "db": "fabric_inventory",
  "username": "username",
  "password": "user password",
  "backup_path": "path_to_backup_location"
}

Run <python app.py>
