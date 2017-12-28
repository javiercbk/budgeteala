[![Build Status](https://travis-ci.org/javiercbk/budgeteala.svg?branch=master)](https://travis-ci.org/javiercbk/naive-mongo)
[![Coverage Status](https://coveralls.io/repos/github/javiercbk/budgeteala/badge.svg?branch=master)](https://coveralls.io/github/javiercbk/naive-mongo?branch=master)

# Budgeteala

Budgeteala is a dockerized web application meant for educational purposes. It aims to provided a non trivial example of a dockerized web application using express and sequelize.

## Running budgeteala in a development environment

Go to the root of the project and execute

```bash
docker-compose build
docker-compose up
```

That will expose the web application in port 5000 and port 9229 will be available for a remote debugger to be attached.

## Running budgeteala tests

In the command line type: `npm test`. The `launch.json` file contains the proper configuration to run the test from **vscode** as well.

## Running budgeteala in a production

If you want to deploy this application in a server it is recommended to create a production docker-compose file that overrides the default environment, you can name it `docker-compose.prod.yml`. That file **SHOULD NOT** be pushed in the repository and **MUST** be kept secret.

In this case you can start the server like this:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
