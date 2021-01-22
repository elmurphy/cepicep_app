const userModel = require("./models/user");
const tokenModel = require("./models/token");
const JwtStrategy = require("passport-jwt").Strategy,
	ExtractJwt = require("passport-jwt").ExtractJwt;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
	new LocalStrategy(
		{
			usernameField: "username",
			passwordField: "password",
		},
		function (username, password, cb) {
			//this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
			return userModel
				.findOne({ username, password })
				.then((user) => {
					if (!user) {
						return cb(null, false, { message: "Incorrect username or password." });
					}
					return cb(null, user, { message: "Logged In Successfully" });
				})
				.catch((err) => cb(err));
		}
	)
);
passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: "your_jwt_secret",
			passReqToCallback: true,
		},
		function (req, jwtPayload, cb) {
			try {
				const token = req.headers["authorization"];
				tokenModel.findOne({ token: token.replace("Bearer ", ""), blacklistedOn: true }, (err, doc) => {
					if (err) return cb(err);
					if (doc) return cb("you token has been removed, signin again");
					
					return userModel
						.findById(jwtPayload._id)
						.then((user) => {
							return cb(null, user);
						})
						.catch((err) => {
							return cb(err);
						});
				});
			} catch (e) {
				return cb("Signin before this request");
			}
		}
	)
);
