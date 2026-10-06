// www.geoqiao.me has no pages of its own; every address moves to geoqiao.me.
export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.host = "geoqiao.me";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  },
};
