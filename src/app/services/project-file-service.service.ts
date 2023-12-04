import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs";
import { Title } from "@angular/platform-browser";
import { MessageService } from "primeng/api";

import { Clip, ClipInstance, Filter, Project, Track } from "../utils/interfaces";
import GLFX_Filters from "../components/filters/filter-selector/filter-definitions/GLFX_Filters.json";
import ImageFilters from "../components/filters/filter-selector/filter-definitions/ImageFilters.json";
import { FilterLibrary } from "../utils/constants";
import { deepCompare, deepCopyObject } from "../utils/utils";

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

	projectSavedIndexInHistory: number = 0;

	projectHistory: Project[] = [];
	historyIndex: number = 0;

	loadClipsSubject: Subject<Clip[]> = new Subject<Clip[]>();
	loadTracksSubject: Subject<Track[]> = new Subject<Track[]>();
	loadProjectNameSubject: Subject<string> = new Subject<string>();
	projectSavedSubject: Subject<any> = new Subject<any>();

	public projectDurationSubject: Subject<number> = new Subject<number>();

	projectLoaded: boolean = false;

	allFilters: any[] = [];

	constructor(
		private messageService: MessageService,
		private ngZone: NgZone,
		private titleService: Title
	) {
		GLFX_Filters.filters = GLFX_Filters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.GLFX}));

		//Concatenates the two filter lists and sorts them by category
		this.allFilters = GLFX_Filters.filters.concat(ImageFilters.filters.map((filter) => Object.assign(filter, {type: FilterLibrary.IMAGE_FILTERS})) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));

		this.projectHistory.push(JSON.parse(JSON.stringify(this.project)));

		this.listenForEvents();
	}

	listenForEvents() {
		window.api.on("project-loaded", (_: any, project: Project) => {
			this.intitaliseProject(project);
		});

		window.api.on("project-saved", (_: any, project: Project) => this.ngZone.run(() => {
			this.messageService.add({severity:"success", summary:"Project saved!"});

			//Updates the project location
			this.project.location = project.location;
			this.location = project.location;

			this.titleService.setTitle(`GraphX - ${this.location}`);

			//Adds the project to the recent projects list
			this.addProjectToRecentProjects();

			this.projectSavedSubject.next(null);
		}));

		window.api.on("video-sucessfully-exported", () => this.ngZone.run(() => {
			this.messageService.add({severity:"success", summary:"Video successfully exported!"});
		}));

		window.api.on("update-track-in-history", (_: any, track: Track) => {
			this.project.tracks = this.project.tracks.map(t => {
				if(t.id === track.id) {
					if(track.width && track.height) {
						t.width = track.width;
						t.height = track.height;
					}else {
						t.clips = track.clips;
					}
				}
				return t;
			});
			this.tracks = this.project.tracks;
			this.loadTracksSubject.next(this.tracks);

			this.titleService.setTitle(`GraphX - * ${this.location}`);
		});
	}

	checkIfClipsExists() {
		const lisOfClips = this.clips.map(clip => clip.location);
		window.api.emit("check-if-clips-need-relinking", lisOfClips);
		window.api.on("clips-that=need-relinking", (_: any, clips: boolean[]) => {
			this.clips = this.project.clips = this.clips.map((clip, index) => {
				clip.needsRelinking = !clips[index];
				return clip;
			});
			this.loadClipsSubject.next(this.project.clips);
		});
	}

	intitaliseProject(project: Project) {
		this.project = JSON.parse(JSON.stringify(project));
		this.name = project.name;
		this.dateCreated = project.dateCreated;
		this.lastModifiedDate = project.lastModifiedDate;
		this.location = project.location;
		this.clips = JSON.parse(JSON.stringify(project.clips));

		this.titleService.setTitle(`GraphX - ${this.location}`);

		//Loops through the clips and check if they need to be relinked
		this.checkIfClipsExists();

		this.tracks = JSON.parse(JSON.stringify(project.tracks));

		this.projectLoaded = true;

		//Tells other components that the project has been loaded
		//and that they should load these clips and tracks
		this.loadTracksSubject.next(project.tracks);
		this.loadProjectNameSubject.next(project.name);

		this.projectHistory = [];
		this.historyIndex = 0;
		this.projectHistory.push(JSON.parse(JSON.stringify(this.project)));

		this.addProjectToRecentProjects();
	}

	addProjectToRecentProjects() {
		let recentProjects = localStorage.getItem("recentProjects");
		if(recentProjects) {
			let recentProjectsArray = JSON.parse(recentProjects);
			//Checks if the project is already in the list
			let projectExists = recentProjectsArray.find((project: any) => 
				project.location === this.location
			);

			if(!projectExists) {
				//Checks if the list is full (max 5)
				//and removes the first item if it is
				if(recentProjectsArray.length === 5) {
					recentProjectsArray.shift();
				}
				recentProjectsArray.push({name: this.name, location: this.location});
				localStorage.setItem("recentProjects", JSON.stringify(recentProjectsArray));
			}else {
				//Changes the name of the project in the list
				recentProjectsArray = recentProjectsArray.map((project: any) => {
					if(project.location === this.location) {
						project.name = this.name;
					}
					return project;
				});
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
		if(deepCompare(this.tracks, tracks)) {
			return;
		}

		this.tracks = JSON.parse(JSON.stringify(tracks));
		this.project.tracks = JSON.parse(JSON.stringify(tracks));

		const showEditedIndicator = deepCompare(this.tracks, this.projectHistory[this.projectSavedIndexInHistory].tracks) ? "" : "*";

		this.titleService.setTitle(`GraphX - ${showEditedIndicator} ${this.location}`);

		this.addProjectToHistory(this.project);
	}

	updateClips(clips: Clip[]) {
		this.clips = clips;

		this.titleService.setTitle(`GraphX - * ${this.location}`);

		//Adds the clips to all projects in the history
		//This prevents the clips from being lost when the user
		//undoes a project change
		//Should only track changes to the tracks in the future
		this.project.clips = JSON.parse(JSON.stringify(clips));
		this.projectHistory.forEach(project => {
			project.clips = JSON.parse(JSON.stringify(clips));
		});
	}

	saveProject() {
		this.project.lastModifiedDate = new Date();
		//If a project is loaded, save it instead of creating a new one
		this.projectSavedIndexInHistory = this.historyIndex;
		if(this.projectLoaded) {
			window.api.emit("save-project", this.project);
		}else {
			window.api.emit("save-project-as", this.project);
		}
	}

	saveProjectAs() {
		this.project.lastModifiedDate = new Date();
		this.projectSavedIndexInHistory = this.historyIndex;
		window.api.emit("save-project-as", this.project);
	}

	isProjectDirty() {
		const projectAtSavedIndex = deepCopyObject(this.projectHistory[this.projectSavedIndexInHistory]);
		const projectNow = deepCopyObject(this.project);
		delete projectAtSavedIndex.lastModifiedDate;
		delete projectNow.lastModifiedDate;

		return !deepCompare(projectAtSavedIndex, projectNow);
	}

	createBlankProject() {
		let project = {
			name: "Untitled Project",
			dateCreated: new Date(),
			lastModifiedDate: new Date(),
			location: "",
			clips: [],
			tracks: []
		};

		window.api.emit("create-blank-project", project);

		window.api.on("project-created", (_:any, location: string) => this.ngZone.run(() => {
			this.project = project;
			this.project.location = location;
			this.location = this.project.location;

			this.titleService.setTitle("GraphX - " + this.location);

			this.name = this.project.name;
			this.dateCreated = this.project.dateCreated;
			this.lastModifiedDate = this.project.lastModifiedDate;
			this.clips = this.project.clips;
			this.tracks = this.project.tracks;

			this.projectLoaded = true;

			this.addProjectToRecentProjects();

			this.projectHistory = [];
			this.historyIndex = 0;
			this.projectSavedIndexInHistory = 0;

			this.loadClipsSubject.next(this.clips);
			this.loadTracksSubject.next(this.tracks);
			this.loadProjectNameSubject.next(this.name);
		}));
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
		if(deepCompare(this.project, this.projectHistory[this.historyIndex])) {
			return;
		}else {
			this.titleService.setTitle(`GraphX - * ${this.location}`);
		}

		if(this.historyIndex === this.projectSavedIndexInHistory) {
			this.titleService.setTitle(`GraphX - ${this.location}`);
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

		this.titleService.setTitle(`GraphX - * ${this.location}`);

		//add the project name to all projects in the history
		//This prevents the project name from being lost when the user
		//undoes a project change
		this.projectHistory.forEach(project => {
			project.name = name;
		});
	}

	relinkClip(clip: Clip) {
		if(!clip.needsRelinking) {
			return;
		}

		const currentLocation = clip.location;

		window.api.emit("relink-clip", currentLocation);

		window.api.on("relinked-clip-data", (_: any, newClipData: any) => {
			this.clips = this.clips.map((c: Clip) => {
				if(c.location === currentLocation) {
					c.needsRelinking = false;
					c.totalDuration = newClipData.duration;
					c.duration = newClipData.duration;
					c.location = newClipData.path;
					c.name = newClipData.name;
				}
				return c;
			});
			this.project.clips = this.clips;
			this.loadClipsSubject.next(this.clips);

			//loop through all tracks and update the clips
			this.tracks = this.tracks.map(track => {
				if(!track.clips) {
					return track;
				}
				track.clips = track.clips.map((c: ClipInstance) => {
					if(c.location === currentLocation) {
						console.log("relinking clip", c);
						c.needsRelinking = false;
						c.location = newClipData.path;

						c.totalDuration = newClipData.duration;
						//Checks if the clip's old duration/in time is within the bounds of the new clip
						c.duration = c.duration > c.totalDuration ? c.totalDuration : c.duration;
						c.in = c.in > c.duration ? c.duration : c.in;
						c.name = newClipData.name;
					}
					return c;
				});
				console.log(track);
				return track;
			});

			this.titleService.setTitle(`GraphX - * ${this.location}`);

			this.project.tracks = this.tracks;
			this.loadTracksSubject.next(this.tracks);
		});
	}
}