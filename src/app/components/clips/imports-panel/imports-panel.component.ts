import { ChangeDetectionStrategy, Component, ViewChild } from "@angular/core";
import { SelectItem } from "primeng/api";
import { Clip } from "src/app/utils/interfaces";
import { ClipInsertionService } from "src/app/services/clip-insertion.service";

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

	clips: Clip[] = [
		{ name: "file1.mp4", location: "C:/Users/Alex/Video", duration: 120 },
		{ name: "file2.mp4", location: "C:/Users/Alex/Video", duration: 140 },
		{ name: "file3.mp4", location: "C:/Users/Alex/Video", duration: 30 },
		{ name: "file4.mp4", location: "C:/Users/Alex/Video", duration: 45 }
	]

	constructor(public cis: ClipInsertionService) {
		this.sortOptions = [
			{label: "A-Z", value: "name"},
            {label: "Z-A", value: "!name"}
        ];
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
}
