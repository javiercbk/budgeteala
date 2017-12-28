FROM mysql:8.0.3
COPY init_db.sql /docker-entrypoint-initdb.d/
RUN if [ -z $(cat /etc/mysql/conf.d/docker.cnf | grep default_time_zone) ]; then echo "default_time_zone='+00:00'" >> /etc/mysql/conf.d/docker.cnf; fi
