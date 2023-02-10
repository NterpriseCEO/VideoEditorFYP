import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { Clip, Filter, Project, Track } from "../utils/interfaces";
import GLFX_Filters from "../components/filters/filter-selector/filter-definitions/GLFX_Filters.json";
import ImageFilters from "../components/filters/filter-selector/filter-definitions/ImageFilters.json";
import { FilterLibrary } from "../utils/constants";
import { MessageService } from "primeng/api";

@Injectable({
	providedIn: "root"
})
export class ProjectFileService {

	name: string = "Untitled Project";
	dateCreated: Date = new Date();
	lastModifiedDate: Date = new Date();
	location: string = "";

	clips: Clip[] = [];
	tracks: Track[] = [];

	project: Project = {
		name: this.name,
		dateCreated: this.dateCreated,
		lastModifiedDate: this.lastModifiedDate,
		location: this.location,
		clips: this.clips,
		tracks: this.tracks
	};

	loadClipsSubject: Subject<Clip[]> = new Subject<Clip[]>();
	loadTracksSubject: Subject<Track[]> = new Subject<Track[]>();
	projectSavedSubject: Subject<any> = new Subject<any>();

	isDirty: boolean = false;

	projectLoaded: boolean = false;

	constructor(private messageService: MessageService) {
		GLFX_Filters.filters = GLFX_Filters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.GLFX}));

		let allFilters;

		//Concatenates the two filter lists and sorts them by category
		allFilters = GLFX_Filters.filters.concat(ImageFilters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.IMAGE_FILTERS})) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));

		window.api.on("project-loaded", (_: any, project: Project) => {
			this.project = project;
			this.name = project.name;
			this.dateCreated = project.dateCreated;
			this.lastModifiedDate = project.lastModifiedDate;
			this.location = project.location;
			this.clips = project.clips;

			//Loops through the tracks and filters merges the filter properties
			//from the project with the filter properties from the list of all filters
			//This is necessary because the project file only stores filter property values
			project.tracks.map(track => {
				track.filters = track.filters?.map(filter => {
					//get the filter by name from the list of all filters and assign it to the track
					const newFilter = allFilters.find(f => f.displayName === filter.displayName);

					if (newFilter) {
						newFilter.enabled = filter.enabled;
						newFilter.properties = filter.properties.map((prop, index) => {
							const newProp = newFilter.properties[index];
							newProp.value = filter.properties[index];
							return newProp;
						});						
					}
					return newFilter;
				});
				return track;
			});

			this.tracks = project.tracks;

			this.projectLoaded = true;
			this.isDirty = false;

			//Tells other components that the project has been loaded
			//and that they should load these clips and tracks
			this.loadClipsSubject.next(this.clips);
			this.loadTracksSubject.next(this.tracks);
		});

		window.api.on("project-saved", () => {
			this.messageService.add({severity:'success', summary:'Project saved!'});
			this.isDirty = false;

			this.projectSavedSubject.next(null);
		});
	}

	loadProject() {
		window.api.emit("load-project");
	}

	updateTracks(tracks: Track[]) {
		this.tracks = tracks;
		this.project.tracks = tracks;

		this.isDirty = true;
	}

	updateClips(clips: Clip[]) {
		this.clips = clips;
		this.project.clips = clips;

		this.isDirty = true;
	}

	saveProject() {
		this.project.lastModifiedDate = new Date();
		if(this.projectLoaded) {
			window.api.emit("save-project", this.project);
		}else {
			window.api.emit("save-project-as", this.project);
		}
	}

	saveProjectAs() {
		this.project.lastModifiedDate = new Date();
		window.api.emit("save-project-as", this.project);
	}

	isProjectDirty() {
		return this.isDirty;
	}

	createBlankProject() {
		this.project = {
			name: "Untitled Project",
			dateCreated: new Date(),
			lastModifiedDate: new Date(),
			location: "",
			clips: [],
			tracks: []
		};

		this.name = this.project.name;
		this.dateCreated = this.project.dateCreated;
		this.lastModifiedDate = this.project.lastModifiedDate;
		this.location = this.project.location;
		this.clips = this.project.clips;
		this.tracks = this.project.tracks;

		this.projectLoaded = true;
		this.isDirty = false;

		this.loadClipsSubject.next(this.clips);
		this.loadTracksSubject.next(this.tracks);
	}
}
