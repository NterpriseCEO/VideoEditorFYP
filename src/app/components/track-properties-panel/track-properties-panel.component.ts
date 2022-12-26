import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FilterLibrary } from 'src/app/utils/constants';
import { Filter } from 'src/app/utils/interfaces';

@Component({
	selector: 'app-track-properties-panel',
	templateUrl: './track-properties-panel.component.html',
	styleUrls: ['./track-properties-panel.component.scss']
})
export class TrackPropertiesPanelComponent {

	//Get dropzone viewchild
	@ViewChild('dropzone') dropzone!: ElementRef;

	selectedSource: string = "webcam";

	filters: Filter[] = [
		{name: "zoomBlur", properties: [231.99996948242188, 293, 1], enabled: false, type: FilterLibrary.GLFX},
		{name: "bulgePinch", properties: [320, 239.5, 200, 1], enabled: false, type: FilterLibrary.GLFX},
		{name: "edgeWork", properties: [10], enabled: false, type: FilterLibrary.GLFX},
		{name: "oil", properties: [5, 32], enabled: false, type: FilterLibrary.IMAGE_FILTERS},
		{name: "invert", properties: [], enabled: false, type: FilterLibrary.IMAGE_FILTERS},
		{name: "sepia", properties: [1], enabled: false, type: FilterLibrary.GLFX},
		{name: "vignette", properties: [0.5, 0.5], enabled: false, type: FilterLibrary.GLFX},
		{name: "colorHalftone", properties: [320, 239.5, 0.25, 4], enabled: false, type: FilterLibrary.GLFX},
		{name: "twirl", properties: [0.5, 0.5, 200, 360], enabled: false, type: FilterLibrary.IMAGE_FILTERS},
	];
	enabledFilters: Filter[] = [];

	draggedFilter: Filter | null = null;

	constructor() {
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit('set-filters', this.enabledFilters);
	}

	dragStart(_, filter: Filter) {
		this.draggedFilter = filter;
	}

	reorderFilters(event) {
		let dropzoneElement = this.dropzone.nativeElement;
		let scroll = dropzoneElement?.scrollLeft + event.x;
		let dropIndex = Math.floor(scroll / 320);


		if (this.draggedFilter) {
			let draggedFilterIndex = this.findIndex(this.draggedFilter);
			this.filters.splice(draggedFilterIndex, 1);

			this.filters.splice(dropIndex, 0, this.draggedFilter);
			this.enabledFilters = this.filters.filter(filter => filter.enabled);
			this.draggedFilter = null;

			window.api.emit('set-filters', this.enabledFilters);
		}
	}

	dragEnd() {
		this.draggedFilter = null;
	}

	setEnabledFilters(filter) {
		filter.enabled = !filter.enabled;
		//Gets a list of all the filters that are enabled
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit('set-filters', this.enabledFilters);
	}

	findIndex(filter: Filter) {
		let index = -1;
		for(let i = 0; i < this.filters.length; i++) {
			if (filter.name === this.filters[i].name) {
				index = i;
				break;
			}
		}
		return index;
	}
}
