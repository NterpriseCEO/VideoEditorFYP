import { Injectable, NgZone } from "@angular/core";
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

	projectHistory: Project[] = [];
	historyIndex: number = 0;

	loadClipsSubject: Subject<Clip[]> = new Subject<Clip[]>();
	loadTracksSubject: Subject<Track[]> = new Subject<Track[]>();
	loadProjectNameSubject: Subject<string> = new Subject<string>();
	projectSavedSubject: Subject<any> = new Subject<any>();

	isDirty: boolean = false;

	projectLoaded: boolean = false;

	constructor(
		private messageService: MessageService,
		private ngZone: NgZone
	) {
		GLFX_Filters.filters = GLFX_Filters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.GLFX}));

		let allFilters;

		//Concatenates the two filter lists and sorts them by category
		allFilters = GLFX_Filters.filters.concat(ImageFilters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.IMAGE_FILTERS})) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));

		this.projectHistory.push(JSON.parse(JSON.stringify(this.project)));

		window.api.on("project-loaded", (_: any, project: Project) => {
			this.project = JSON.parse(JSON.stringify(project));
			this.name = project.name;
			this.dateCreated = project.dateCreated;
			this.lastModifiedDate = project.lastModifiedDate;
			this.location = project.location;
			this.clips = JSON.parse(JSON.stringify(project.clips));

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

			this.tracks = JSON.parse(JSON.stringify(project.tracks));

			this.projectLoaded = true;
			this.isDirty = false;

			//Tells other components that the project has been loaded
			//and that they should load these clips and tracks
			this.loadClipsSubject.next(JSON.parse(JSON.stringify(project.clips)));
			this.loadTracksSubject.next(JSON.parse(JSON.stringify(project.tracks)));
			this.loadProjectNameSubject.next(project.name);

			this.projectHistory = [];
			this.historyIndex = 0;
			this.projectHistory.push(JSON.parse(JSON.stringify(this.project)));

			this.addProjectToRecentProjects();
		});

		window.api.on("project-saved", (_: any, project: Project) => this.ngZone.run(() => {
			this.messageService.add({severity:"success", summary:"Project saved!"});
			this.isDirty = false;

			//Updates the project location
			this.project.location = project.location;
			this.location = project.location;

			//Adds the project to the recent projects list
			this.addProjectToRecentProjects();

			this.projectSavedSubject.next(null);
		}));
	}

	addProjectToRecentProjects() {
		let recentProjects = localStorage.getItem("recentProjects");
		if(recentProjects) {
			let recentProjectsArray = JSON.parse(recentProjects);
			//Checks if the project is already in the list
			let projectExists = recentProjectsArray.find((project: any) => 
				project.location === this.location && project.name === this.name
			);

			if(!projectExists) {
				//Checks if the list is full (max 5)
				//and removes the first item if it is
				if(recentProjectsArray.length === 5) {
					recentProjectsArray.shift();
				}
				recentProjectsArray.push({name: this.name, location: this.location});
				localStorage.setItem("recentProjects", JSON.stringify(recentProjectsArray));
			}
		}else {
			//Adds the project to the list
			localStorage.setItem("recentProjects", JSON.stringify([{name: this.name, location: this.location}]));
		}
	}

	loadProject() {
		window.api.emit("load-project");
	}

	updateTracks(tracks: Track[]) {
		//Compare the tracks to see if they have changed
		//if they haven't changed, don't update them
		//This prevent the project from being marked as dirty
		//when the user clicks on a track

		if(JSON.stringify(this.tracks) === JSON.stringify(tracks)) {
			return;
		}
		
		this.tracks = JSON.parse(JSON.stringify(tracks));
		this.project.tracks = JSON.parse(JSON.stringify(tracks));

		this.isDirty = true;

		this.addProjectToHistory(this.project);
	}

	updateClips(clips: Clip[]) {
		this.clips = clips;

		this.isDirty = true;

		//Adds the clips to all projects in the history
		//This prevents the clips from being lost when the user
		//undoes a project change
		//Should only track changes to the tracks in the future
		this.projectHistory.forEach(project => {
			project.clips = JSON.parse(JSON.stringify(clips));
		});
	}

	saveProject() {
		this.project.lastModifiedDate = new Date();
		//If a project is loaded, save it instead of creating a new one
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

		this.projectLoaded = false;
		this.isDirty = false;

		this.loadClipsSubject.next(this.clips);
		this.loadTracksSubject.next(this.tracks);
		this.loadProjectNameSubject.next(this.name);
	}

	addProjectToHistory(project: Project) {
		//Adds the project to the history at the historyIndex
		//and remove all projects after the historyIndex
		this.historyIndex++;

		//Set the length of the array to the historyIndex
		this.projectHistory.length = this.historyIndex;
		
		this.projectHistory.push(JSON.parse(JSON.stringify(project)));	
	}

	undo() {
		this.historyIndex--;
		if(this.historyIndex < 0) {
			this.historyIndex = 0;
		}

		this.updateFromHistory();
	}

	redo() {
		this.historyIndex++;
		if(this.historyIndex > this.projectHistory.length - 1) {
			this.historyIndex = this.projectHistory.length - 1;
		}

		this.updateFromHistory();
	}

	updateFromHistory() {
		//Skips the update if the prject is the same as the one in the history
		if(JSON.stringify(this.project) === JSON.stringify(this.projectHistory[this.historyIndex])) {
			return;
		}

		this.project = JSON.parse(JSON.stringify(this.projectHistory[this.historyIndex]));

		this.loadClipsSubject.next(this.project.clips);
		this.clips = JSON.parse(JSON.stringify(this.project.clips));

		this.loadTracksSubject.next(this.project.tracks);
		this.tracks = JSON.parse(JSON.stringify(this.project.tracks));
	}

	setProjectName(name: string) {
		this.name = name;
		this.project.name = name;
		this.isDirty = true;

		//add the project name to all projects in the history
		//This prevents the project name from being lost when the user
		//undoes a project change
		this.projectHistory.forEach(project => {
			project.name = name;
		});
	}
}
