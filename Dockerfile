FROM node:8.9.3-alpine
WORKDIR /usr/src/budgeteala
RUN apk update
RUN apk add bash python mysql-client g++ make
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json /usr/src/budgeteala/
RUN npm install --production
# prevent bcrypt from segmentation fault on alpine
RUN npm rebuild bcrypt --build-from-source
# Bundle app source
ADD ./.sequelizerc /usr/src/budgeteala/.sequelizerc
ADD ./app /usr/src/budgeteala/app
ADD ./docker-server-entrypoint.sh /usr/src/budgeteala/docker-server-entrypoint.sh
# expose the server port
# EXPOSE 5000
# EXPOSE 9229
RUN cp docker-server-entrypoint.sh /usr/local/bin/ && \
  chmod +x /usr/local/bin/docker-server-entrypoint.sh
ENTRYPOINT [ "/usr/local/bin/docker-server-entrypoint.sh" ]
