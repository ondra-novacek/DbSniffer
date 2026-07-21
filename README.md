# Setup

## 1. Enable MySQL binary logging

Add the following to your MySQL configuration:

```ini
[mysqld]
server_id=1
log_bin=mysql-bin
binlog_format=ROW
binlog_row_image=FULL
```

Restart MySQL after.

## 2. Create a database user

```sql
CREATE USER 'cdc'@'localhost' IDENTIFIED BY 'cdc_password';

GRANT REPLICATION SLAVE, REPLICATION CLIENT, SELECT
ON *.*
TO 'cdc'@'localhost';

FLUSH PRIVILEGES;
```

## 3. Configure the database

In `src/server/index.ts`, set `WATCH_DATABASE` to the database you want to monitor.

## 4. Install dependencies

```bash
npm install
```

# Run the app

```bash
npm run dev
```
