@echo off
echo Connecting to MySQL and adding dimensions column...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p21chase%3F -h 127.0.0.1 -e "ALTER TABLE Product ADD COLUMN dimensions VARCHAR(191) NULL;" market
echo SQL command executed.
pause
