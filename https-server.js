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
