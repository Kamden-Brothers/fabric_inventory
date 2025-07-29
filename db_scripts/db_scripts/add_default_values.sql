INSERT INTO fabric_inventory.dbo.material (material)
VALUES
	('Cotton'),
	('Flannel'),
	('Fleece'),
	('Wool'),
	('Canvas');

SELECT * FROM fabric_inventory.dbo.material;


INSERT INTO fabric_inventory.dbo.cut (cut)
VALUES
	('Uncut'),
	('Partially'),
	('Scrappy'),
	('Multiple Pieces');

SELECT * FROM fabric_inventory.dbo.cut;


INSERT INTO fabric_inventory.dbo.style(style)
VALUES
	('Flat Fold'),
	('Board: Large'),
	('Board: Small'),
	('Fat Quarter'),
	('Apron'),
	('Panel'),
	('Kit'),
	('Charm Pack'),
	('Bundle'),
	('Jelly Roll');

SELECT * FROM fabric_inventory.dbo.style;
