import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Filter, FilterInstance, Track } from "src/app/utils/interfaces";
import { TracksService } from "src/app/services/tracks.service";
import { ProjectFileService } from "src/app/services/project-file-service.service";

@Component({
	selector: "app-track-properties-panel",
	templateUrl: "./track-properties-panel.component.html",
	styleUrls: ["./track-properties-panel.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackPropertiesPanelComponent implements OnInit, AfterViewChecked {

	//Get dropzone viewchild
	@ViewChild("dropzone") dropzone!: ElementRef;

	adjacentElement: any;
	draggedFilterIndex: number = -1;

	filters: FilterInstance[] = [];
	enabledFilters: FilterInstance[] = [];

	draggedFilter: FilterInstance | null = null;

	addingFilter: boolean = false;
	filtersCount: number = 0;

	layerFilter!: any;

	selectedTrack: Track | null = null;

	constructor(
		private trackService: TracksService,
		private changeDetector: ChangeDetectorRef,
		private pfService: ProjectFileService
	) {}

	ngOnInit() {
		this.listenForEvents();
	}

	ngAfterViewChecked() {
		//Scrolls to the right when a filter is added
		if(this.addingFilter) {
			this.addingFilter = false;
			this.dropzone.nativeElement.scrollLeft = this.dropzone.nativeElement.scrollWidth;
		}
	}

	listenForEvents() {
		this.trackService.filtersChangedSubject.subscribe((updateProject: boolean) => {
			//Checks if a filter is being added not removed
			this.addingFilter = this.filtersCount < this.filters.length;
			this.filtersCount = this.filters.length;

			this.changeFilters(updateProject);
		});

		this.trackService.tracksSubject.subscribe(() => {
			this.changeFilters(false);
		});

		this.trackService.selectedTrackChangedSubject.subscribe(track => {
			this.selectedTrack = track;
			this.changeDetector.detectChanges();
		});
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

		//Returns the first child of the filter at the specified index
		this.adjacentElement = dropzoneElement?.children[index].children[0];

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
		if(this.draggedFilter) {
			// Remove the dragged filter at the old position
			this.filters.splice(this.draggedFilterIndex, 1);

			// Add the dragged filter at the new position
			this.filters.splice(dropIndex, 0, this.draggedFilter);
			// Gets a list of all the filters that are enabled
			this.enabledFilters = this.filters.filter(filter => filter.enabled);
			this.draggedFilter = null;
			// Emit the new list of filters to the main process
			this.changeFilters();
		}
	}

	dragEnd() {
		this.draggedFilter = null;
	}

	updateFilter(filter: FilterInstance) {
		this.trackService.getSelectedTrack()!.filters = this.filters;
		this.changeFilters();
	}

	changeFilters(updateProjectFile: boolean = true) {
		let filters = this.trackService.getSelectedTrackFilters()!;
		this.filters = filters ? filters : [];
		// Gets a list of all the filters that are enabled
		this.enabledFilters = JSON.parse(JSON.stringify(this.filters.filter((filter: FilterInstance) => filter.enabled)));
		if(!this.enabledFilters) {
			return;
		}

		let filtersToChange = JSON.parse(JSON.stringify(this.enabledFilters));

		// Map the filters from property definitions to property values only

		this.enabledFilters = [...this.enabledFilters];

		this.changeDetector.markForCheck();

		//Updates the project file object
		if(updateProjectFile) {
			let tracks = this.trackService.getTracks();
			tracks[tracks.findIndex(track => track.id === this.trackService.getSelectedTrack()!.id)].filters = this.filters;
			this.pfService.updateTracks(this.trackService.getTracks());
			window.api.emit("update-filters", this.trackService.getSelectedTrack());
		}
	}

	setEnabledFilters(filter: FilterInstance) {
		this.trackService.toggleFilter(filter);
		this.changeFilters();
	}

	findIndex(filter: FilterInstance) {
		let index = -1;
		// Find the index of a specific filter by name
		for(let i = 0; i < this.filters.length; i++) {
			if(filter.function === this.filters[i].function) {
				index = i;
				break;
			}
		}
		return index;
	}

	removeFilter(filter: FilterInstance) {
		// Remove the filter from the list of filters
		this.trackService.removeFilter(filter);
		// Gets a list of all the filters that are enabled
		this.changeFilters();
	}

	updateLayerFilter(event: any) {
		this.trackService.updateLayerFilter(event);
		this.changeFilters();
	}
}
