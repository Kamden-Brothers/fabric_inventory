

SELECT f.fabric_id, fabric_name, material, designer, fabric_line, year_on_selvage, width, yardage, cut, style, rack_id, stack_id, colors, tags FROM fabric_inventory.dbo.fabric f
LEFT JOIN fabric_inventory.dbo.material m ON m.material_id = f.material_id
LEFT JOIN fabric_inventory.dbo.designer d ON d.designer_id = f.designer_id
LEFT JOIN fabric_inventory.dbo.fabric_line f_l ON f_l.fabric_line_id = f.fabric_line_id
LEFT JOIN fabric_inventory.dbo.cut c ON c.cut_id = f.cut_id
LEFT JOIN fabric_inventory.dbo.style s ON s.style_id = f.style_id
LEFT JOIN (
	SELECT cj.fabric_id, STRING_AGG(color.color, ', ') AS colors
	FROM fabric_inventory.dbo.color_junction as cj
	LEFT JOIN fabric_inventory.dbo.color ON color.color_id = cj.color_id
	GROUP BY cj.fabric_id
) AS colors ON colors.fabric_id = f.fabric_id
LEFT JOIN (
	SELECT tj.fabric_id, STRING_AGG(tag.tag, ', ') as tags
	FROM fabric_inventory.dbo.tag_junction as tj
	LEFT JOIN fabric_inventory.dbo.tag ON tag.tag_id = tj.tag_id
	GROUP BY tj.fabric_id
) AS tags ON tags.fabric_id = f.fabric_id;


SELECT * FROM fabric_inventory.dbo.fabric;