import express from "express";

import multer from "multer";
import crypto from "crypto";
import sharp from "sharp";

import { uploadFile, getObjectSignedUrl } from "./s3.js";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import axios from "axios";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const dburl = process.env.DBURL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//routes
import { Image } from "./models/Image.js";

//mongoose db
import mongoose from "mongoose";
mongoose.connect(dburl, { useNewUrlParser: true });
const mdb = mongoose.connection;
mdb.on("error", (error) => console.error(error));
mdb.once("open", () => console.log("Connected to Mongoose"));
//cors
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

upload.single("image");

app.use(express.static(path.resolve(__dirname, "../web/build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../web/build", "index.html"));
});

app.post("/api/posts", upload.single("image"), async (req, res) => {
  const file = req.file;

  const fileBuffer = await sharp(file.buffer)
    .resize({ height: 1080, width: 1080, fit: "contain" })
    .toBuffer();

  const imageName = generateFileName();
  await uploadFile(fileBuffer, imageName, file.mimetype);

  let imageUrl = await getObjectSignedUrl(imageName);

  var image = new Image({
    images: imageUrl,
  });

  image.save(function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      res.status(201).send({ imgURL: imageUrl });
    }
  });
});

app.get("/api/posts", async (req, res) => {
  let data = [];
  Image.find({}).then(function (users) {
    const length = users.length;

    for (let i = 0; i < length; i++) {
      let imgURL = users[i].images;
      let imgId = users[i]._id;
      getExpirationDate(imgURL, imgId);

      data.push({ imgURL: imgURL });
    }

    // console.log(data);
    res.status(201).send(data);
  });

  //
});

function updateDatabase(imageUrl, imgId) {
  Image.findOneAndUpdate(
    { _id: imgId },
    { $set: { images: imageUrl } },
    { new: true },
    (err, doc) => {
      if (err) {
        console.log("Something wrong when updating data!");
      }

      console.log(doc);
    }
  );
}

async function getExpirationDate(imgURL, imgId) {
  var config = {
    method: "get",
    url: `${imgURL}`,
    headers: {},
  };

  let objectKey = await axios(config)
    .then((response) => {
      console.log(response.status);
    })
    .catch((error) => {
      // Handle error
      console.log(error.response.status);
      var urlObject = new URL(imgURL);
      var objectKey = urlObject.pathname.split("/").pop();
      console.log(objectKey); // Output: "OBJECT_KEY"
      return objectKey;
    });

  console.log(objectKey);
  if (objectKey) {
    let imageUrl = await getObjectSignedUrl(objectKey);
    console.log(imageUrl);
    updateDatabase(imageUrl, imgId);
  }
}

app.listen(8000, function () {
  console.log("listening on port 8000");
});
