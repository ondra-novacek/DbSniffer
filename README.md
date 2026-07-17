## Enable binlog (and restart mysql)

[mysqld]
server_id=1
log_bin=mysql-bin
binlog_format=ROW
binlog_row_image=FULL

## Create user in DB

CREATE USER 'cdc'@'localhost' IDENTIFIED BY 'cdc_password';

GRANT REPLICATION SLAVE, REPLICATION CLIENT, SELECT
ON _._
TO 'cdc'@'localhost';

FLUSH PRIVILEGES;
