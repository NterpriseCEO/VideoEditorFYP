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

	projects: Project[] = [];
	activeProject: number = -1;

	project: Project = {
		name: this.name,
		dateCreated: this.dateCreated,
		lastModifiedDate: this.lastModifiedDate,
		location: this.location,
		clips: this.clips,
		tracks: this.tracks
	};

	projectSavedIndexInHistory: number[] = [];

	projectHistory: any[][] = [];
	historyIndexes: number[] = [];

	loadClipsSubject: Subject<Clip[]> = new Subject<Clip[]>();
	loadTracksSubject: Subject<{ resetPreview?: boolean, tracks: Track[], projectId?: number }>
		= new Subject<{ resetPreview?: boolean, tracks: Track[], projectId?: number }>();
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
		const glfx_filters = GLFX_Filters.map((filter) => Object.assign(filter, {type: FilterLibrary.GLFX})) as Filter[];

		//Concatenates the two filter lists and sorts them by category
		this.allFilters = glfx_filters.concat(ImageFilters.map((filter) => Object.assign(filter, {type: FilterLibrary.IMAGE_FILTERS})) as Filter[])
			.sort((a, b) => a.category.localeCompare(b.category));

		this.listenForEvents();
	}

	listenForEvents() {
		window.api.on("project-loaded", (_: any, project: Project) => {
			this.initialiseProject(project);
		});

		window.api.on("project-saved", (_: any, project: Project) => this.ngZone.run(() => {
			this.messageService.add({severity:"success", summary:"Project saved!"});

			//Updates the project location
			this.projects[this.activeProject].location = project.location;
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
			const activeProject = this.projects[this.activeProject];
			activeProject.tracks = activeProject.tracks.map(t => {
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
			this.tracks = activeProject.tracks;
			this.loadTracksSubject.next({tracks: this.tracks, projectId: this.activeProject});

			this.titleService.setTitle(`GraphX - * ${this.location}`);
		});

		window.api.on("project-unzipped", (_: any, project: Project) => {
			this.initialiseProject(project);
		});

		window.api.on("clips-that-need-relinking", (_: any, clips: boolean[] | string) => {
			const activeProject = this.projects[this.activeProject];
			const singleClip = this.clips.find(clip => clip.location === clips);

			if(typeof clips === "string" && singleClip) {
				singleClip.needsRelinking = true;
				activeProject.clips.find(clip => clip.location === clips)!.needsRelinking = true;
			}else {
				this.clips = activeProject.clips = this.clips.map((clip, index) => {
					clip.needsRelinking = !clips[index];
					return clip;
				});
			}

			this.loadClipsSubject.next(activeProject.clips);
		});
	}

	checkIfClipsExist() {
		const lisOfClips = this.clips.map(clip => clip.location);
		window.api.emit("check-if-clips-need-relinking", lisOfClips);
	}

	initialiseProject(project: Project) {
		window.api.emit("listen-for-project-changes");
		this.activeProject = this.projects.length;

		project = this.prepareLoadFile(project);

		this.projects[this.activeProject] = JSON.parse(JSON.stringify(project));
		this.name = project.name;
		this.dateCreated = project.dateCreated;
		this.lastModifiedDate = project.lastModifiedDate;
		this.location = project.location;
		this.clips = JSON.parse(JSON.stringify(project.clips));

		this.titleService.setTitle(`GraphX - ${this.location}`);

		//Loops through the clips and check if they need to be relinked
		this.checkIfClipsExist();

		this.tracks = JSON.parse(JSON.stringify(project.tracks));

		this.projectLoaded = true;
		//Tells other components that the project has been loaded
		//and that they should load these clips and tracks
		this.loadTracksSubject.next({ tracks: project.tracks, resetPreview: true, projectId: this.activeProject });
		this.loadProjectNameSubject.next(project.name);

		this.projectHistory[this.activeProject] = [JSON.parse(JSON.stringify(project))];
		this.historyIndexes[this.activeProject] = 0;
		this.projectSavedIndexInHistory[this.activeProject] = 0;

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
				if(recentProjectsArray.length === 10) {
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
		this.projects[this.activeProject].tracks = JSON.parse(JSON.stringify(tracks));
		this.project = JSON.parse(JSON.stringify(this.projects[this.activeProject]))
		const history = this.projectHistory[this.activeProject][this.historyIndexes[this.activeProject]];

		const showEditedIndicator = deepCompare(this.tracks, history.tracks) ? "" : "*";

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
		this.projects[this.activeProject].clips = JSON.parse(JSON.stringify(clips));
		const history = this.projectHistory[this.activeProject];
		history.forEach(project => {
			project.clips = JSON.parse(JSON.stringify(clips));
		});
	}

	saveProject() {
		const project = deepCopyObject(this.projects[this.activeProject]);
		project.lastModifiedDate = new Date();
		this.prepareSaveFile(project);
		//If a project is loaded, save it instead of creating a new one
		this.projectSavedIndexInHistory[this.activeProject] = this.historyIndexes[this.activeProject];
		if(this.projectLoaded) {
			window.api.emit("save-project", project);
		}else {
			window.api.emit("save-project-as", project);
		}
	}

	saveProjectAs() {
		const project = this.projects[this.activeProject];
		project.lastModifiedDate = new Date();

		this.projectSavedIndexInHistory[this.activeProject] = this.historyIndexes[this.activeProject];
		window.api.emit("save-project-as", this.prepareSaveFile(project));
	}

	areProjectsDirty() {
		return this.projectHistory.filter((project, i) => {
			const projectAtSavedIndex = this.prepareSaveFile(deepCopyObject(project[this.projectSavedIndexInHistory[i]] || {}));
			const projectNow = this.prepareSaveFile(deepCopyObject(this.projects[i] || {}));
			delete projectAtSavedIndex.lastModifiedDate;
			delete projectNow.lastModifiedDate;

			return !deepCompare(projectAtSavedIndex, projectNow);
		}).length > 0;
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
			this.activeProject = this.projects.length;
			this.projects[this.activeProject] = project;
			const activeProject = this.projects[this.activeProject];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
			activeProject.location = location;
			this.location = this.project.location;

			this.titleService.setTitle("GraphX - " + this.location);

			this.name = activeProject.name;
			this.dateCreated = activeProject.dateCreated;
			this.lastModifiedDate = activeProject.lastModifiedDate;
			this.clips = activeProject.clips;
			this.tracks = activeProject.tracks;

			this.projectLoaded = true;

			this.addProjectToRecentProjects();

			this.projectHistory = [];
			this.historyIndexes[this.activeProject] = 0;
			this.projectSavedIndexInHistory[this.activeProject] = 0;

			this.loadClipsSubject.next(this.clips);
			this.loadTracksSubject.next({ tracks: this.tracks, projectId: this.activeProject });
			this.loadProjectNameSubject.next(this.name);
		}));
	}

	addProjectToHistory(project: Project) {
		//Adds the project to the history at the historyIndex
		//and remove all projects after the historyIndex
		this.historyIndexes[this.activeProject]++;

		if(!this.projectHistory[this.activeProject]) this.projectHistory[this.activeProject] = [];
		const history = this.projectHistory[this.activeProject];
		//Set the length of the array to the historyIndex
		history.length = this.historyIndexes[this.activeProject];

		history.push(JSON.parse(JSON.stringify(project)));

		if(deepCompare(project, history[this.projectSavedIndexInHistory[this.activeProject]])) {
			this.titleService.setTitle(`GraphX - ${this.location}`);
		}
	}

	undo() {
		this.historyIndexes[this.activeProject]--;
		if(this.historyIndexes[this.activeProject] < 0) {
			this.historyIndexes[this.activeProject] = 0;
		}

		this.updateFromHistory();
	}

	redo() {
		this.historyIndexes[this.activeProject]++;
		if(this.historyIndexes[this.activeProject] > this.projectHistory[this.activeProject].length - 1) {
			this.historyIndexes[this.activeProject] = this.projectHistory[this.activeProject].length - 1;
		}

		this.updateFromHistory();
	}

	updateFromHistory() {
		const history = this.projectHistory[this.activeProject];
		//Skips the update if the prject is the same as the one in the history
		if(deepCompare(this.projects[this.activeProject], history[this.historyIndexes[this.activeProject]])) {
			return;
		}else {
			this.titleService.setTitle(`GraphX - * ${this.location}`);
		}
		
		if(this.historyIndexes[this.activeProject] === this.projectSavedIndexInHistory[this.activeProject]) {
			this.titleService.setTitle(`GraphX - ${this.location}`);
		}

		this.projects[this.activeProject] = JSON.parse(JSON.stringify(history[this.historyIndexes[this.activeProject]]));
		const activeProject = this.projects[this.activeProject];

		this.loadClipsSubject.next(activeProject.clips);
		this.clips = JSON.parse(JSON.stringify(activeProject.clips));
		this.loadTracksSubject.next({ tracks: activeProject.tracks, projectId: this.activeProject });
		this.tracks = JSON.parse(JSON.stringify(activeProject.tracks));
	}

	setProjectName(name: string) {
		this.name = name;
		this.projects[this.activeProject].name = name;

		this.titleService.setTitle(`GraphX - * ${this.location}`);

		//add the project name to all projects in the history
		//This prevents the project name from being lost when the user
		//undoes a project change
		this.projectHistory[this.activeProject].forEach(project => {
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
			this.projects[this.activeProject].clips = this.clips;
			this.loadClipsSubject.next(this.clips);

			//loop through all tracks and update the clips
			this.tracks = this.tracks.map(track => {
				if(!track.clips) {
					return track;
				}
				track.clips = track.clips.map((c: ClipInstance) => {
					if(c.location === currentLocation) {
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
				return track;
			});

			this.titleService.setTitle(`GraphX - * ${this.location}`);

			this.projects[this.activeProject].tracks = this.tracks;
			this.loadTracksSubject.next({ tracks: this.tracks, projectId: this.activeProject });
		});
	}

	setActiveProject(index: number) {
		this.activeProject = index;
		this.project = this.projects[index];
		this.clips = this.projects[index].clips;
		this.tracks = this.projects[index].tracks;
		this.loadClipsSubject.next(this.clips);
		this.loadTracksSubject.next({ tracks: this.tracks, resetPreview: true, projectId: this.activeProject });
		this.loadProjectNameSubject.next(this.projects[index].name);
		this.location = this.projects[index].location;
		this.titleService.setTitle(`GraphX - ${this.location}`);
	}

	zipProject() {
		window.api.emit("zip-project", this.projects[this.activeProject]);
		window.api.once("project-zipped", (_: any, location: string) => {
			this.messageService.add({severity:"success", summary:"Project zipped!"});
		});
	}

	unzipProject() {
		window.api.emit("unzip-project");
	}

	// Same as areProjectsDirty but for a specific project
	isProjectDirty(projectIndex: number) {
		const projectAtSavedIndex = deepCopyObject(this.projectHistory[projectIndex][this.projectSavedIndexInHistory[projectIndex]] || {});
		const projectNow = deepCopyObject(this.projects[projectIndex] || {});
		delete projectAtSavedIndex.lastModifiedDate;
		delete projectNow.lastModifiedDate;

		return !deepCompare(projectAtSavedIndex, this.prepareSaveFile(projectNow));
	}

	closeProject(projectIndex: number) {
		this.projects.splice(projectIndex, 1);
		this.projectHistory.splice(projectIndex, 1);
		this.historyIndexes.splice(projectIndex, 1);
		this.projectSavedIndexInHistory.splice(projectIndex, 1);

		if(this.activeProject === -1) {
			return;
		}

		if(this.activeProject === projectIndex) {
			this.activeProject--;
			this.setActiveProject(this.activeProject);
		}
	}

	prepareSaveFile(project) {
		project.clips = project.clips.map(clip => ({
			location: clip.location,
			duration: clip.duration,
			type: clip.type,
		}));

		project.tracks.forEach(track => {
			delete track.id;

			// Deletes default values
			if(track.isVisible || track.isVisible?.length === 0) delete track.isVisible;
			if(!track.muted || track.muted?.length === 0) delete track.muted;
			if(track.layerFilter === "") delete track.layerFilter;
			if(track.clips.length === 0) delete track.clips;

			track.clips?.forEach(clip => {
				delete clip.name;
				delete clip.totalDuration;
				delete clip.location;
				delete clip.needsRelinking;
				delete clip.thumbnail;
				delete clip.type;
			});

			if(track.filters) {
				track.filters = track?.filters.map(filter => ({
					function: filter.function,
					enabled: filter.enabled === true ? undefined : false,
					properties: filter.properties ?? undefined,
				}));
			}

			if(track.filters?.length === 0) delete track.filters;
		});
		return project;
	}

	prepareLoadFile(project) {
		project.clips.forEach((clip, id) => {
			clip.id = id;
			clip.name = clip.location.substring(clip.location.lastIndexOf(clip.location.includes("/") ? "/" : "\\") + 1);
			clip.totalDuration = clip.duration;
		});
		project.tracks.forEach((track, id) => {
			track.id = id;
			track.clips?.forEach((clip) => {
				// Finds the clip in the project clips so that the clip can be updated
				// This prevente unnecessary duplication of clip info in any track
				// that uses the same clip
				const matchingClip = project.clips.find(c => c.id === clip.id);
				clip.location = matchingClip?.location || "";
				clip.name = clip.location.substring(clip.location.lastIndexOf(clip.location.includes("/") ? "/" : "\\") + 1);
				clip.type = track.type;
				clip.totalDuration = matchingClip?.duration || 0;
				clip.thumbnail = matchingClip?.thumbnail || "";
			});

			if(track.isVisible === undefined) track.isVisible = true;

			if(!track.layerFilter) track.layerFilter = "";

			track.filters?.forEach((filter, id) => {
				if(filter.enabled === undefined) filter.enabled = true;
				// Finds the filter in the filter library
				const filterLibrary = this.allFilters.find(f => f.function === filter.function);
				filter.type = filterLibrary?.type;
			});
		});

		return project;
	}
}