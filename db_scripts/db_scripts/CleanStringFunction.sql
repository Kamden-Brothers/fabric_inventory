CREATE FUNCTION dbo.CleanString (@input NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @output NVARCHAR(MAX) = @input;

    -- Replace special characters
    SET @output = REPLACE(REPLACE(REPLACE(@output, '@', ''), '!', ''), '#', '');
    SET @output = REPLACE(REPLACE(REPLACE(@output, '$', ''), '%', ''), '^', '');
    SET @output = REPLACE(REPLACE(@output, '&', ''), '*', '');
    SET @output = REPLACE(REPLACE(@output, '(', ''), ')', '');
    SET @output = REPLACE(REPLACE(REPLACE(@output, ' ', ''), '_', ''), '-', '');
    
    -- Add more replacements as needed

    RETURN @output;
END;
