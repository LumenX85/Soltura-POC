const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 8080;

const options = {
  key: fs.readFileSync(
    path.join(__dirname, "certs", "localhost+2-key.pem")
  ),
  cert: fs.readFileSync(
    path.join(__dirname, "certs", "localhost+2.pem")
  )
};

const frontendDir =
  path.join(__dirname, "frontend");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = https.createServer(
  options,
  (req, res) => {

    if (req.url === "/gemini-token") {
      const proxyRequest = require("http").get(
        "http://127.0.0.1:3000/gemini-token",
        proxyResponse => {
          res.writeHead(
            proxyResponse.statusCode || 500,
            proxyResponse.headers
          );

          proxyResponse.pipe(res);
        }
      );

      proxyRequest.on("error", error => {
        console.error("Erreur proxy :", error);

        res.writeHead(502, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          error: "Backend Soltura inaccessible"
        }));
      });

      return;
    }

    let requestedPath =
      req.url === "/"
        ? "/index.html"
        : req.url;

    requestedPath =
      requestedPath.split("?")[0];

    const filePath =
      path.join(
        frontendDir,
        requestedPath
      );

    if (!filePath.startsWith(frontendDir)) {
      res.writeHead(403);
      res.end("Acces refuse");
      return;
    }

    fs.readFile(filePath, (error, data) => {

      if (error) {
        res.writeHead(404);
        res.end("Fichier introuvable");
        return;
      }

      const extension =
        path.extname(filePath);

      res.writeHead(200, {
        "Content-Type":
          mimeTypes[extension] ||
          "application/octet-stream"
      });

      res.end(data);
    });
  }
);

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Soltura frontend HTTPS actif sur le port ${PORT}`
  );
});
