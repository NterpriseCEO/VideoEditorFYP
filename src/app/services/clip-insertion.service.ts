import { Injectable } from "@angular/core";
import { Clip } from "../utils/interfaces";

@Injectable({
	providedIn: "root"
})
export class ClipInsertionService {

	private currentClip: Clip | null = null;

	private isAddingClip: boolean = false;

	constructor() { }

	setCurrentClip(clip: Clip | null) {
		this.currentClip = clip;
		this.isAddingClip = clip !== null;
	}

	getCurrentClip(): Clip {
		return this.currentClip!;
	}

	getIsAddingClip(): boolean {
		return this.isAddingClip;
	}
}