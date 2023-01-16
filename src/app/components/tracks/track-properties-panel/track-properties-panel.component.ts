import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FilterLibrary } from "src/app/utils/constants";
import { FilterInstance } from "src/app/utils/interfaces";

@Component({
	selector: "app-track-properties-panel",
	templateUrl: "./track-properties-panel.component.html",
	styleUrls: ["./track-properties-panel.component.scss"]
})
export class TrackPropertiesPanelComponent {

	//Get dropzone viewchild
	@ViewChild("dropzone") dropzone!: ElementRef;

	selectedSource: string = "webcam";

	adjacentElement: any;
	draggedFilterIndex: number = -1;

	filters: FilterInstance[] = [
		{function: "zoomBlur", displayName: "Zoom blur", properties: [231.99996948242188, 293, 1], enabled: false, type: FilterLibrary.GLFX, category: "test"},
		{function: "bulgePinch", displayName: "Bulge Pinch", properties: [320, 239.5, 200, 1], enabled: false, type: FilterLibrary.GLFX, category: "test"},
		{function: "edgeWork", displayName: "Edge work", properties: [10], enabled: true, type: FilterLibrary.GLFX, category: "test"},
		{function: "oil", displayName: "Oil painting", properties: [5, 32], enabled: false, type: FilterLibrary.IMAGE_FILTERS, category: "test"},
		{function: "invert", displayName: "Invert colours",properties: [], enabled: false, type: FilterLibrary.IMAGE_FILTERS, category: "test"},
		{function: "sepia", displayName: "Sepia", properties: [1], enabled: false, type: FilterLibrary.GLFX, category: "test"},
		{function: "vignette", displayName: "Vignette", properties: [0.5, 0.5], enabled: false, type: FilterLibrary.GLFX, category: "test"},
		{function: "colorHalftone", displayName: "Colour halftone", properties: [320, 239.5, 0.25, 4], enabled: false, type: FilterLibrary.GLFX, category: "test"},
		{function: "twirl", displayName: "Twirl", properties: [0.5, 0.5, 200, 360], enabled: false, type: FilterLibrary.IMAGE_FILTERS, category: "test"},
	];
	enabledFilters: FilterInstance[] = [];

	draggedFilter: FilterInstance | null = null;

	constructor() {
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit("set-filters", this.enabledFilters);
	}

	dragStart(event: DragEvent, filter: FilterInstance) {
		this.draggedFilter = filter;
		// The index of the filter that is being dragged
		this.draggedFilterIndex = this.findIndex(filter);
	}

	drag(event: DragEvent) {
		// Remove the border from the previous element that was hovered
		this.adjacentElement?.classList.remove("dropzone-right");
		this.adjacentElement?.classList.remove("dropzone-left");
		// Get the dropzone element
		let dropzoneElement = this.dropzone.nativeElement;
		// Get the scroll position of the dropzone element
		let bounds = dropzoneElement.getBoundingClientRect();
		let scroll = (dropzoneElement?.scrollLeft + event.x)-bounds.left;

		// Get the modulo of the scroll position based on the width of the element
		let scrollMod = scroll % 320;
		// Get the index of the element that the dragged element is closest to
		let dropIndex = Math.floor(scroll / 320);

		// If the remainder is greater than 170, then the dragged element is closer to the next element
		let index = dropIndex;

		this.adjacentElement = dropzoneElement?.children[index];
		
		// Adds a spacing to the element that the dragged element is closest to to indicate where it will be dropped
		if(scrollMod > 235 && dropIndex > this.draggedFilterIndex) {
			this.adjacentElement?.classList.add("dropzone-right");
		}else if(scrollMod < 235 && dropIndex < this.draggedFilterIndex) {
			this.adjacentElement?.classList.add("dropzone-left");
		}
	}

	reorderFilters(event) {
		// Get the dropzone element
		let dropzoneElement = this.dropzone.nativeElement;
		// Get the scroll position of the dropzone element
		let scroll = dropzoneElement?.scrollLeft + event.x;
		// Get the index of the element that the dragged element is closest to
		let dropIndex = Math.floor(scroll / 320);

		// Remove the border from the previous element that was hovered
		this.adjacentElement?.classList.remove("dropzone-right");
		this.adjacentElement?.classList.remove("dropzone-left");

		// If the dragged filter is not null, then reorder the filters
		if (this.draggedFilter) {
			console.log("reorder", scroll, dropIndex);
			
			// Remove the dragged filter at the old position
			this.filters.splice(this.draggedFilterIndex, 1);

			// Add the dragged filter at the new position
			this.filters.splice(dropIndex, 0, this.draggedFilter);
			// Gets a list of all the filters that are enabled
			this.enabledFilters = this.filters.filter(filter => filter.enabled);
			this.draggedFilter = null;

			// Emit the new list of filters to the main process
			window.api.emit("set-filters", this.enabledFilters);
		}
	}

	dragEnd() {
		this.draggedFilter = null;
	}

	setEnabledFilters(filter) {
		filter.enabled = !filter.enabled;
		//Gets a list of all the filters that are enabled
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit("set-filters", this.enabledFilters);
	}

	findIndex(filter: FilterInstance) {
		let index = -1;
		// Find the index of a specific filter by name
		for(let i = 0; i < this.filters.length; i++) {
			if (filter.function === this.filters[i].function) {
				index = i;
				break;
			}
		}
		return index;
	}

	removeFilter(filter: FilterInstance) {
		// Remove the filter from the list of filters
		this.filters.splice(this.findIndex(filter), 1);
		// Gets a list of all the filters that are enabled
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit("set-filters", this.enabledFilters);
	}

	// Clamps a number between a max and min value
	clamp(num: number, max: number, min: number = 0) {
		return Math.min(Math.max(num, min), max)
	}
}
