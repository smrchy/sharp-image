import config from "./config";
import * as request from "request";
import * as _ from "lodash";
import * as sharp from "sharp";

class Mw {

	constructor () {}

	public checkData (req, res, next) {
		// Make sure there is a command separated by `=` is supplied
		// e.g. /image/https%3A%2F%2Fwww.webmart.de%2Fweb%2Fimg%2Fsuche_ss2.png=s320
		let parts: Array<string> = req.params[0].split("=");
		let command = parts[parts.length - 1];
		// Check command - must start with an `s`
		// If not we just try to load the image
		if (command.slice(0, 1) !== "s" || parts.length === 1) {
			if (parts.length === 1) {
				res.locals.image_url = parts[0];
			}
			else {
				res.locals.image_url = parts.join("=");
			}
			next();
			return;
		}
		// Check if command is way too long. Must be 3-7 chars (e.g. s10 - s9999-c)
		else if (command.length < 3 || command.length > 7) {
			next({message: "Invalid resize command. Invalid length.", status: 403});
			return;
		}

		res.locals.image_url = parts.slice(0, -1).join("=");

		// Check if it is a crop operation
		if (command.slice(-2) === "-c") {
			res.locals.image_size = parseInt(command.slice(1, -2), 10);
			res.locals.image_iscrop = true;
			// Make sure image size is a positive integer that is in the allowed crop sizes array.
			if (!config.IMG_SERVING_CROP_SIZES.includes(res.locals.image_size)) {
				next({message: "Invalid crop size.", status: 403});
				return;
			}

		}
		// Normal resize operation
		else {
			res.locals.image_size = parseInt(command.slice(1), 10);
			if (!config.IMG_SERVING_SIZES.includes(res.locals.image_size)) {
				next({message: "Invalid size.", status: 403});
				return;
			}
		}

		next();
	}

	public loadImage (req, res, next) {
		// let image = decodeURIComponent(res.locals.image_url);
		let image = res.locals.image_url;
		// Quick fix for some unsupported files
		const image_suffix = _.last(image.split(".")).toLowerCase();
		if (image_suffix === "bmp") {
			next({message: "Unsupported image format.", status: 200});
			return;
		}
		if (image.slice(0, 4) !== "http") {
			image = "http://" + image;
		}
		request({
			url: image,
			method: "GET",
			followRedirect: true,
			encoding: null
		}, (err, resp, body) => {
			if (err) {
				next(err);
				return;
			}
			if (resp.statusCode !== 200) {
				next({message: "Request failed.", status: resp.statusCode});
				return;
			}
			res.locals.image_headers = resp.headers;
			res.locals.image_body = body;
			next();
		});
	}

	public processImage (req, res, next) {
		const _finish = (data) => {
			res.set({"Content-Type": res.locals.image_headers["content-type"]})
			.send(data);
			next();
		};
		if (!res.locals.image_size) {
			_finish(res.locals.image_body);
		}
		else if (res.locals.image_iscrop) {
			sharp(res.locals.image_body)
			.resize(res.locals.image_size, res.locals.image_size)
			.toBuffer()
			.then(_finish)
			.catch(next);
		}
		else {
			sharp(res.locals.image_body)
			.resize(res.locals.image_size, null, {withoutEnlargement: true})
			.toBuffer()
			.then(_finish)
			.catch(next);
		}
	}
}
export const mw = new Mw();
