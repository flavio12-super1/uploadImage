import mongoose from "mongoose";

const imageScheme = new mongoose.Schema({
  images: {
    type: String,
    required: false,
  },
});

const Image = mongoose.model("images", imageScheme);
export { Image };
