const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const tokenSchema = new Schema({
	token: {
		type: String,
		required: true,
	},
	blacklistedOn: {
		type: Boolean,
		default: true,
	},
});

module.exports = mongoose.model("token", tokenSchema);