const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const opts = { toJSON: { virtuals: true } };
const KampexSchema = new Schema(
  {
    title: String,

    images: [{ url: String, filename: String }],
    image1: String,
    price: Number,
    description: String,
    location: String,
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  opts
);

KampexSchema.virtual("properties.popUpMarkup").get(function () {
  return `
    <strong><a href="/kampex/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 30)}...</p >
`;
});

module.exports = mongoose.model("Kampex", KampexSchema);
