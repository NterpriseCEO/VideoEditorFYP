import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { MenuItem, SelectItem } from "primeng/api";
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
export class ImportsPanelComponent implements OnInit {

	//reference dv ViewChild
	@ViewChild("dv") dv!: any;

	sortOptions: SelectItem[] = [];
	sortOrder: number = 1;

	sortField: string = "!name";

	clips: Clip[] = []

	brokenImage: string = "assets/clip-icon.png";

	selectedClip: Clip | null = null;

	clipMenu: MenuItem[] = [
		// {
		// 	label: "Relink Clip",
		// 	icon: "pi pi-link",
		// 	command: (event: any) => this.relinkClip(event.item)
		// },
		// {
		// 	label: "Delete Clip",
		// 	icon: "pi pi-trash",
		// 	command: (event: any) => this.removeFile(event.item)
		// }
		//reverse clip
		{
			label: "Reverse Clip",
			icon: "pi pi-refresh",
			command: (_: any) => {
				this.cs.reverseClip(this.selectedClip!);
			}
		},
	];

	constructor(
		public cs: ClipService,
		private ngZone: NgZone,
		private changeDetector: ChangeDetectorRef,
		private pfService: ProjectFileService
	) {}

	ngOnInit() {
		this.sortOptions = [
			{label: "A-Z", value: "name"},
			{label: "Z-A", value: "!name"}
        ];

		this.listenForEvents();

		this.clips = this.pfService.clips;
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
				if(!this.clips.find(({name}) => name === n)) {
					this.clips.push({
						id: this.clips.length,
						name: n,
						location: file.location,
						thumbnail: file.thumbnail,
						duration: file.duration,
						totalDuration: file.duration,
						type: file.type ?? TrackType.VIDEO
					});
				}
			});

			//Update the clips array to trigger change detection
			this.clips = [...this.clips];

			this.pfService.updateClips(this.clips);
			this.changeDetector.detectChanges();
		}));

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

		if(value.indexOf("!") === 0) {
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

	relinkClip(clip: Clip) {
		this.pfService.relinkClip(clip);
	}
}
