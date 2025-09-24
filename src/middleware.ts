import { defineMiddleware } from "astro:middleware";
import data from "./assets/data.json";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.webdata = data;

  // return a Response or the result of calling `next()`
  return next();
});