import { random } from "./random";
import * as crypto from "crypto";

export function randomString(len: number): string {
	if (!Number.isFinite(len)) {
		throw new TypeError("Expected a finite number");
	}

	return crypto
		.randomBytes(Math.ceil(len / 2))
		.toString("hex")
		.slice(0, len);
}
