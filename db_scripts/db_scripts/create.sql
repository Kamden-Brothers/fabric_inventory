IF db_id('fabric_inventory') IS NULL
	create database fabric_inventory
GO

IF OBJECT_ID('fabric_inventory.dbo.material') IS NULL
	CREATE TABLE fabric_inventory.dbo.material (
		material_id INT IDENTITY(1,1) PRIMARY KEY,
		material VARCHAR(20) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.rack') IS NULL
	CREATE TABLE fabric_inventory.dbo.rack (
		rack_id INT PRIMARY KEY
	);
	
IF OBJECT_ID('fabric_inventory.dbo.stack') IS NULL
	CREATE TABLE fabric_inventory.dbo.stack (
		stack_id INT PRIMARY KEY
	);

IF OBJECT_ID('fabric_inventory.dbo.tag') IS NULL
	CREATE TABLE fabric_inventory.dbo.tag (
		tag_id INT IDENTITY(1,1) PRIMARY KEY,
		tag VARCHAR(100) UNIQUE
	);
	
IF OBJECT_ID('fabric_inventory.dbo.color') IS NULL
	CREATE TABLE fabric_inventory.dbo.color (
		color_id INT IDENTITY(1,1) PRIMARY KEY,
		color VARCHAR(30) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.collection_name') IS NULL
	CREATE TABLE fabric_inventory.dbo.collection_name (
		collection_id INT IDENTITY(1,1) PRIMARY KEY,
		collection_name VARCHAR(100) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.designer') IS NULL
	CREATE TABLE fabric_inventory.dbo.designer (
		designer_id INT IDENTITY(1,1) PRIMARY KEY,
		designer VARCHAR(100) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.fabric_line') IS NULL
	CREATE TABLE fabric_inventory.dbo.fabric_line (
		fabric_line_ID INT IDENTITY(1,1) PRIMARY KEY,
		fabric_line VARCHAR(100) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.cut') IS NULL
	CREATE TABLE fabric_inventory.dbo.cut (
		cut_ID INT IDENTITY(1,1) PRIMARY KEY,
		cut VARCHAR(25) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.style') IS NULL
	CREATE TABLE fabric_inventory.dbo.style (
		style_id INT IDENTITY(1,1) PRIMARY KEY,
		style VARCHAR(25) UNIQUE
	);

IF OBJECT_ID('fabric_inventory.dbo.fabric') IS NULL
	CREATE TABLE fabric_inventory.dbo.fabric (
		fabric_id INT IDENTITY(1,1) PRIMARY KEY,
		fabric_name VARCHAR(100) UNIQUE,
		material_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.material(material_id),
		designer_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.designer(designer_id),
		fabric_line_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.fabric_line(fabric_line_id),
		year_on_selvage INT CHECK (year_on_selvage >= 1000 AND year_on_selvage <= 3000 OR year_on_selvage IS NULL),
		width DECIMAL(6, 2),
		yardage DECIMAL(6, 2),
		collection_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.collection_name(collection_id),
		cut_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.cut(cut_id),
		style_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.style(style_id),
		rack_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.rack(rack_id),
		stack_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.stack(stack_id),
		image_type VARCHAR(10)
	);

IF OBJECT_ID('fabric_inventory.dbo.color_junction') IS NULL
	CREATE TABLE fabric_inventory.dbo.color_junction (
		fabric_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.fabric(fabric_id),
		color_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.color(color_id),
		PRIMARY KEY (fabric_id, color_id)
	);

IF OBJECT_ID('fabric_inventory.dbo.tag_junction') IS NULL
	CREATE TABLE fabric_inventory.dbo.tag_junction (
		fabric_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.fabric(fabric_id),
		tag_id INT FOREIGN KEY REFERENCES fabric_inventory.dbo.tag(tag_id),
		PRIMARY KEY (fabric_id, tag_id)
	);
