import expressAsyncHandler from "express-async-handler";

export const wrapAsync = (router) => {
  const wrap = (fn) => expressAsyncHandler(fn);

  // Store the original route methods
  const methods = ["get", "post", "put", "delete", "patch", "use"];

  methods.forEach((method) => {
    const original = router[method].bind(router);
    router[method] = function (path, ...handlers) {
      handlers = handlers.map((handler) => {
        // If it's a router (has .route property), wrap it recursively
        if (handler && handler.route) {
          return wrapAsync(handler);
        }
        // If it's a function, wrap it with expressAsyncHandler
        return typeof handler === "function" ? wrap(handler) : handler;
      });
      return original(path, ...handlers);
    };
  });

  // Also wrap any existing routes
  if (router.stack) {
    router.stack.forEach((layer) => {
      if (layer.route) {
        layer.route.stack.forEach((routeLayer) => {
          if (typeof routeLayer.handle === "function") {
            routeLayer.handle = wrap(routeLayer.handle);
          }
        });
      } else if (layer.handle && layer.handle.route) {
        wrapAsync(layer.handle);
      }
    });
  }

  return router;
};
