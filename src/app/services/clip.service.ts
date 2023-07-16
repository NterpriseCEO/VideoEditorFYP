import { Injectable } from "@angular/core";
import { Clip, ClipInstance } from "../utils/interfaces";
import { Subject } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class ClipService {

	private currentClip: Clip | null = null;

	private isAddingClip: boolean = false;

	currentlySelectedClip: ClipInstance | null = null;
	currentlyDraggedClip: ClipInstance | null = null;

	//clip selection update subject
	clipSelectionUpdateSubject = new Subject<ClipInstance | null>();
	lastDraggedClipSubject = new Subject<ClipInstance | null>();

	draggedDistanceDiff: number = 0;
	isDragging: boolean = false;

	clipBeingResized: ClipInstance | null = null;
	clipElementBeingResized: HTMLElement | null = null;

	phantomClip: ClipInstance | null = null;

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

	selectClip(clip: ClipInstance) {
		this.currentlySelectedClip = clip;
		this.clipSelectionUpdateSubject.next(clip);
	}
	unSelectClip() {
		this.currentlySelectedClip = null;
		this.clipSelectionUpdateSubject.next(null);
	}

	getCurrentlySelectedClip(): ClipInstance | null {
		return this.currentlySelectedClip;
	}

	setDraggedClip(clip: ClipInstance | null) {
		this.currentlyDraggedClip = clip;
	}
	getDraggedClip(): ClipInstance | null {
		return this.currentlyDraggedClip;
	}

	completeDrag() {
		if(this.currentlyDraggedClip == null) {
			return;
		}

		this.lastDraggedClipSubject.next(JSON.parse(JSON.stringify(this.currentlyDraggedClip)));
		this.resetDraggedClip();
	}

	resetDraggedClip() {
		this.currentlyDraggedClip = null;
		this.draggedDistanceDiff = 0;
		this.isDragging = false;
	}

	setDraggedDistanceDiff(diff: number) {
		this.draggedDistanceDiff = diff;
	}
	getDraggedDistanceDiff(): number {
		return this.draggedDistanceDiff;
	}

	isDraggingClip(): boolean {
		return this.isDragging;
	}

	setIsDraggingClip(isDragging: boolean) {
		this.isDragging = isDragging;
	}
	setPhantomClip(clip: ClipInstance | null) {
		this.phantomClip = clip;
	}
	getPhantomClip(): ClipInstance | null {
		return this.phantomClip;
	}

	getClipBeingResized(): ClipInstance | null {
		return this.clipBeingResized;
	}
	setClipBeingResized(clip: ClipInstance | null) {
		this.clipBeingResized = clip;
	}

	getClipElementBeingResized(): HTMLElement | null {
		return this.clipElementBeingResized;
	}
	setClipElementBeingResized(element: HTMLElement | null) {
		this.clipElementBeingResized = element;
	}
}