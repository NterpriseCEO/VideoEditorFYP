import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewChild } from "@angular/core";
import { SelectItem } from "primeng/api";
import { Clip } from "src/app/utils/interfaces";
import { ClipService } from "src/app/services/clip.service";
import { TrackType } from "src/app/utils/constants";
import { ProjectFileService } from "src/app/services/project-file-service.service";

@Component({
	selector: "app-imports-panel",
	templateUrl: "./imports-panel.component.html",
	styleUrls: ["./imports-panel.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportsPanelComponent {

	//reference dv ViewChild
	@ViewChild("dv") dv!: any;

	sortOptions: SelectItem[] = [];
	sortOrder: number = 1;

	sortField: string = "!name";

	clips: Clip[] = []

	constructor(
		public cs: ClipService,
		private ngZone: NgZone,
		private changeDetector: ChangeDetectorRef,
		private pfService: ProjectFileService
	) {
		this.sortOptions = [
			{label: "A-Z", value: "name"},
			{label: "Z-A", value: "!name"}
        ];

		this.listenForEvents();
	}

	listenForEvents() {
		window.api.on("imported-files", (_:any, files: any[]) => this.ngZone.run(() => {
			//Checks if the clips array has any items matching the names
			//of the files being imported
			//if not, adds them to the array
			files.forEach((file: any) => {
				//Gets everything after the last slash (the file name)
				let nme = file.name;
				let n = nme.substring(nme.lastIndexOf(nme.includes("/") ? "/" : "\\") + 1);
				if (!this.clips.find(({name}) => name === n)) {
					this.clips.push({
						name: n,
						location: file.name,
						duration: file.duration,
						totalDuration: file.duration,
						type: TrackType.VIDEO
					});
				}
			});

			//Update the clips array to trigger change detection
			this.clips = [...this.clips];

			this.pfService.updateClips(this.clips);			

			this.changeDetector.detectChanges();
		}));

		window.api.on("thumbnails", (_:any, thumbnails: any[]) => {
			//Adds the thumbnail data to the clips array
			thumbnails.forEach((thumbnail: any, index: number) => {
				//find the clip matching thumbnail.associatedFile
				//and set the thumbnail property to the thumbnail data

				thumbnail.associatedFile = thumbnail.associatedFile.replace(/\\/g, "/");

				//Reformat the the clip name to convert backslashes to forward slashes
				this.clips = this.clips.map((clip: Clip) => {
					clip.location = clip.location.replace(/\\/g, "/");
					return clip;
				});

				//Finds the clip matching the thumbnail.associatedFile and sets the thumbnail
				this.clips.find(({location}) => location == thumbnail.associatedFile)!
					.thumbnail = "local-resource://getMediaFile/" + thumbnail.thumbnail;
			});
			this.clips = [...this.clips];

			this.pfService.updateClips(this.clips);
			this.changeDetector.detectChanges();
		});

		this.pfService.loadClipsSubject.subscribe((clips: Clip[]) => {
			this.clips = [...clips];
			this.changeDetector.detectChanges();
		});
	}

	removeFile(file: any) {
		this.clips = this.clips.filter(f => f !== file);
	}

	filter(event: any) {
		this.dv.filter(event?.target.value)
	}

	//Terrible default code from PrimeNG but works for now
	onSortChange(event) {
		let value = event.value;

		if (value.indexOf("!") === 0) {
			this.sortOrder = -1;
			this.sortField = value.substring(1, value.length);
		}
		else {
			this.sortOrder = 1;
			this.sortField = value;
		}
	}

	importFiles() {
		window.api.emit("import-files");
	}
}
