const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

/*
 * CORS — POC Soltura V0
 *
 * Autorise :
 * - le frontend utilisé localement sur le PC :
 *     http://localhost:8080
 *
 * - le frontend servi par le PC sur le réseau local :
 *     http://192.168.x.x:8080
 *
 * Cela permet notamment au Pixel 9a d'utiliser
 * le backend Node.js du PC pendant les tests du POC.
 */
app.use(cors({
  origin: (origin, callback) => {

    // Requêtes sans Origin :
    // navigation directe, curl, etc.
    if (!origin) {
      return callback(null, true);
    }

    const localhostAllowed =
      origin === "http://localhost:8080";

    const localNetworkAllowed =
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/.test(
        origin
      );

    if (localhostAllowed || localNetworkAllowed) {
      return callback(null, true);
    }

    console.warn(
      "Origine CORS refusée :",
      origin
    );

    return callback(
      new Error("Origine CORS non autorisée")
    );
  }
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    application: "Soltura POC vocal V0",
    backend: "OK"
  });
});

app.get("/gemini-token", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Clé Gemini absente"
      });
    }

    const now = Date.now();

    const expireTime =
      new Date(
        now + 30 * 60 * 1000
      ).toISOString();

    const newSessionExpireTime =
      new Date(
        now + 60 * 1000
      ).toISOString();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/auth_tokens",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key":
            process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({
          uses: 1,
          expireTime,
          newSessionExpireTime
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Erreur Gemini :",
        data
      );

      return res
        .status(response.status)
        .json({
          error:
            "Impossible de créer le jeton Gemini",
          details: data
        });
    }

    res.json({
      token: data.name,
      expireTime: data.expireTime,
      newSessionExpireTime:
        data.newSessionExpireTime
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur interne du backend"
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Soltura backend actif sur le port ${PORT}`
  );
});
