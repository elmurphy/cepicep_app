const mongoose = require("mongoose");
const userModel = require("./models/user");
const bookModel = require("./models/book");
const reviewModel = require("./models/reviews");
const rateModel = require("./models/rate");
const likedModel = require("./models/liked");
const userbanModel = require("./models/userban");
const borrowhistoryModel = require("./models/borrowhistory");
const tokenModel = require("./models/token");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");

// , passport.authenticate("jwt", { session: false })
module.exports = (app) => {
	app.post("/api/users/login", (req, res, next) => {
		passport.authenticate("local", { session: false }, (err, user, info) => {
			console.log(err);
			if (err || !user) {
				return res.status(400).json({
					message: info ? info.message : "Login failed",
					user: user,
				});
			}

			req.login(user, { session: false }, (err) => {
				if (err) {
					res.send(err);
				}
				const userObj = user.toObject();
				const now = new Date();
				userbanModel.findOne({ userId: userObj._id, banned: { $gt: now } }, (err, doc) => {
					if (err) {
						return res.send("error");
					}
					if (doc) return res.send(res.send("you have been banned until " + doc.banned));
					const token = jwt.sign(userObj, "your_jwt_secret");

					return res.json({ user: { _id: userObj._id, username: userObj.username, avatarPath: userObj.avatarPath, role: userObj.role }, token });
				});
			});
		})(req, res);
	});

	app.post("/api/users", (req, res, next) => {
		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send("No files were uploaded.");
		}

		const sampleFile = req.files.file;
		const uploadPath = __dirname + "/upload/" + sampleFile.name;

		const user = new userModel({ username: req.body.username, password: req.body.password, role: "basic", avatarPath: "/upload/" + sampleFile.name });

		const error = user.validateSync();
		if (error) res.send(error);

		sampleFile.mv(uploadPath, function (err) {
			if (err) return res.status(500).send(err);

			userModel
				.create(user)
				.then((x) => {
					res.send(true);
				})
				.catch((x) => {
					res.send(false);
				});
		});
	});

	app.get("/api/admin/users", (req, res, next) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));
		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		userModel.find((err, docs) => {
			if (err) return res.send(err);
			const responseData = [];
			for (const i in docs) {
				const currentDoc = docs[i];
				responseData.push({ role: currentDoc.role, isDeleted: currentDoc.isDeleted, username: currentDoc.username, avatarPath: currentDoc.avatarPath, _id: currentDoc._id });
			}
			res.send(responseData);
		});
	});

	app.delete("/api/users/logout", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"].replace("Bearer ", "");

		const token = new tokenModel({
			blacklistedOn: true,
			token: bearer,
		});

		tokenModel
			.create(token)
			.then((x) => {
				res.send(true);
			})
			.catch((x) => {
				res.send(false);
			});
	});

	app.get("/api/books/:page/:pagesize", (req, res) => {
		const pagesize = parseInt(req.params.pagesize);
		const page = parseInt(req.params.page);

		bookModel.find({ isDelisted: true }, ["title", "author"], { skip: pagesize * (page - 1), limit: pagesize }, (err, docs) => {
			if (err) return res.send(err);
			res.send(docs);
		});
	});

	app.get("/api/books/:id", (req, res) => {
		const id = req.params.id;

		bookModel
			.findById(id)
			.then((x) => {
				res.send(x);
			})
			.catch((err) => {
				res.send("wrong id");
			});
	});

	app.post("/api/books/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
		const id = req.params.id;

		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		borrowhistoryModel
			.create({ bookId: id, userId: user._id })
			.then((x) => {
				bookModel
					.findOneAndUpdate({ _id: id, isBorrowed: false }, { isBorrowed: true })
					.then((x) => {
						if (!x) return res.send("book not found");
						res.send(true);
					})
					.catch((err) => {
						res.send(false);
					});
			})
			.catch((x) => {
				res.send(false);
			});
	});

	app.delete("/api/books/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
		const id = req.params.id;

		bookModel
			.findOneAndUpdate({ _id: id, isBorrowed: true }, { isBorrowed: false })
			.then((x) => {
				if (!x) return res.send("book not found");
				res.send("true");
			})
			.catch((err) => {
				res.send("false");
			});
	});

	app.post("/api/admin/books", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));
		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send("No files were uploaded.");
		}

		const sampleFile = req.files.file;
		const uploadPath = __dirname + "/upload/" + sampleFile.name;

		const book = new bookModel({
			title: req.body.title,
			author: req.body.author,
			userId: user._id,
			photo: sampleFile.name,
		});

		const error = book.validateSync();
		if (error) return res.send(error);

		sampleFile.mv(uploadPath, function (err) {
			if (err) return res.status(500).send(err);

			bookModel
				.create(book)
				.then((x) => {
					res.send(true);
				})
				.catch((x) => {
					res.send(false);
				});
		});
	});

	app.post("/api/books/:id/reviews", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));
		const bookId = req.params.id;

		const review = new reviewModel({
			review: req.body.review,
			userId: user._id,
			bookId: bookId,
		});

		const error = review.validateSync();
		if (error) return res.send(error);

		reviewModel
			.create(review)
			.then((x) => {
				res.send(true);
			})
			.catch((x) => {
				res.send(false);
			});
	});

	app.get("/api/books/:id/reviews/:page/:pagesize", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bookId = req.params.id;
		const pagesize = parseInt(req.params.pagesize);
		const page = parseInt(req.params.page);

		reviewModel.find({ bookId, isDeleted: false }, ["review"], { skip: pagesize * (page - 1), limit: pagesize }, (err, docs) => {
			if (err) return res.send(err);
			res.send(docs);
		});
	});

	app.put("/api/books/:id/reviews/:reviewId", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const bookId = req.params.id;
		const reviewId = req.params.reviewId;
		const newReview = req.body.review;

		reviewModel
			.findOneAndUpdate({ bookId, _id: reviewId, userId: user._id }, { review: newReview })
			.then((x) => {
				if (!x) return res.send("review not found");
				res.send("true");
			})
			.catch((err) => {
				res.send("false");
			});
	});

	app.delete("/api/books/:id/reviews/:reviewId", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const bookId = req.params.id;
		const reviewId = req.params.reviewId;

		reviewModel
			.findOneAndUpdate({ bookId, _id: reviewId, userId: user._id }, { isDeleted: true })
			.then((x) => {
				if (!x) return res.send("review not found");
				res.send("true");
			})
			.catch((err) => {
				res.send("false");
			});
	});

	app.delete("/api/books/:id/reviews/:reviewId", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const bookId = req.params.id;
		const reviewId = req.params.reviewId;

		reviewModel
			.findOneAndUpdate({ bookId, _id: reviewId, userId: user._id }, { isDeleted: true })
			.then((x) => {
				if (!x) return res.send("review not found");
				res.send("true");
			})
			.catch((err) => {
				res.send("false");
			});
	});

	app.put("/api/books/:id/rate", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const bookId = req.params.id;
		const rateValue = req.body.rate;

		const rate = new rateModel({
			rate: rateValue,
			userId: user._id,
			bookId: bookId,
		});

		const error = rate.validateSync();
		if (error) return res.send(error);

		rateModel
			.create(rate)
			.then((x) => {
				res.send(true);
			})
			.catch((x) => {
				res.send(false);
			});
	});

	app.put("/api/reviews/:reviewId/:id/votes", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const reviewId = req.params.reviewId;
		const bookId = req.params.id;
		const likedValue = req.body.liked;

		const liked = new likedModel({
			liked: likedValue,
			reviewId: reviewId,
			userId: user._id,
			bookId: bookId,
		});

		const error = liked.validateSync();
		if (error) return res.send(error);

		likedModel
			.create(liked)
			.then((x) => {
				res.send(true);
			})
			.catch((x) => {
				res.send(false);
			});
	});

	app.put("/api/admin/users/:id/banstatus", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		const userId = req.params.id;
		const bannedUntil = new Date(req.body.banned);
		const description = req.body.description;

		const userban = new userbanModel({
			banned: bannedUntil,
			description: description,
			userId,
		});

		const error = userban.validateSync();
		if (error) return res.send(error);

		userbanModel
			.create(userban)
			.then((x) => {
				res.send(true);
			})
			.catch((x) => {
				res.send(false);
			});
	});

	app.put("/api/admin/books/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		const bookId = req.params.id;
		bookModel.findByIdAndUpdate(bookId, { title: req.body.title, author: req.body.author }, (err, doc) => {
			if (err) return res.send(err);
			res.send(true);
		});
	});

	app.delete("/api/admin/books/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		const bookId = req.params.id;
		bookModel.findOneAndDelete(bookId, (err, doc) => {
			if (err) return res.send(err);
			res.send(true);
		});
	});

	app.get("/api/admin/books/:id/reviews", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		const bookId = req.params.id;
		reviewModel.find({ bookId: bookId }, (err, docs) => {
			if (err) return res.send(err);
			res.send(docs);
		});
	});

	app.put("/api/admin/books/:id/reviews/:reviewId", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		const bookId = req.params.id;
		const reviewId = req.params.reviewId;

		reviewModel.findOneAndUpdate({ _id: reviewId, bookId: bookId }, { review: req.body.review }, (err, doc, res2) => {
			if (err) return res.send(err);
			res.send(true);
		});
	});

	app.delete("/api/admin/books/:id/reviews/:reviewId", passport.authenticate("jwt", { session: false }), (req, res) => {
		const bearer = req.headers["authorization"];
		const user = jwt_decode(bearer.replace("Bearer ", ""));

		const isBearerAdmin = user.role == "admin";
		if (!isBearerAdmin) {
			return res.send("login as an admin.");
		}

		const bookId = req.params.id;
		const reviewId = req.params.reviewId;

		reviewModel.findOneAndUpdate({ _id: reviewId, bookId: bookId }, { isDeleted: true }, (err, doc) => {
			if (err) return res.send(err);
			res.send(true);
		});
	});
};
