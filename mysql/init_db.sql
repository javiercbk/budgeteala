CREATE DATABASE IF NOT EXISTS budgeteala;

CREATE USER 'budgeteala'@'%' IDENTIFIED BY 'budgeteala';

GRANT ALL PRIVILEGES on budgeteala.*
TO 'budgeteala'@'%' IDENTIFIED BY 'budgeteala'
WITH GRANT OPTION;

FLUSH PRIVILEGES;