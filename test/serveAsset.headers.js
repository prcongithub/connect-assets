var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");
var connect = require("connect");
var http = require("http");
var url = require("url");

describe("serveAsset", function () {
  describe("headers", function () {
    beforeEach(function (done) {
      var ctx = this;
      var app = this.app = connect().use(assets({
        paths: [ "test/assets/js", "test/assets/css" ],
        helperContext: ctx
      }));

      app.listen(function () {
        var address = this.address();
        ctx.host = "http://" + address.address + ":" + address.port;
        done();
      });
    });

    it("sends Cache-Control header with expiration set to a year", function (done) {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.headers["cache-control"]).to.equal("public, max-age=31536000");
        done();
      });
    });

    it("sends Date header", function (done) {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.headers["date"]).to.not.equal(undefined);
        done();
      });
    });

    it("sends Last-Modified header", function (done) {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.headers["last-modified"]).to.not.equal(undefined);
        done();
      });
    });

    it("sends ETag header set to fingerprint", function (done) {
      var path = this.assetPath("blank.js");
      var url = this.host + path;
      var fingerprint = path.match(/-([0-9a-f]{32,40})\.[^.]+$/)[1];

      http.get(url, function (res) {
        expect(res.headers["etag"]).to.equal('"' + fingerprint + '"');
        done();
      });
    });

    it("sends Content-Type header application/javascript for javascript", function (done) {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.headers["content-type"]).to.equal("application/javascript; charset=UTF-8");
        done();
      });
    });

    it("sends Content-Type header text/css for css", function (done) {
      var path = this.assetPath("blank.css");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.headers["content-type"]).to.equal("text/css; charset=UTF-8");
        done();
      });
    });

    it("does not send a body if request method is HEAD", function (done) {
      var path = this.assetPath("blank.js");
      var opts = url.parse(this.host + path);
      var body = "";

      opts.method = "HEAD";

      http.request(opts, function (res) {
        res.setEncoding("utf8");
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(body).to.equal("");
          done();
        });
      }).end();
    });

    it("sends body if request method is GET", function (done) {
      var path = this.assetPath("blank.js");
      var url = this.host + path;
      var body = "";

      http.get(url, function (res) {
        res.setEncoding("utf8");
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(body).to.equal("\n;\n");
          done();
        });
      });
    });

    describe("status codes", function () {
      it("sends HTTP 405 if method isn't GET or HEAD");
      it("sends HTTP 400 if request contains '..' or null characters");
      it("sends HTTP 304 if request If-None-Match header matches ETag");
    });
  });
});
