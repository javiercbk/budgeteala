const AbstractRouter = require('../../lib/router/abstract-router');

class HomeRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      this.route({
        apiCall: async () => null
      })
    );
  }
}

const homeRouter = new HomeRouter();
homeRouter.init();
module.exports = homeRouter.router;
