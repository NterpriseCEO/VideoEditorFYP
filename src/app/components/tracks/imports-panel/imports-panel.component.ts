import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Component({
	selector: 'app-imports-panel',
	templateUrl: './imports-panel.component.html',
	styleUrls: ['./imports-panel.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportsPanelComponent {


	//reference dv ViewChild
	@ViewChild('dv') dv!: any;

	sortOptions: SelectItem[] = [];
	sortOrder: number = 1;

	sortField: string = "!name";


	files: any[] = [
		{ name: 'file1.mp4', size: 1000, location: "C:/Users/Alex/Video" },
		{ name: 'file2.mp4', size: 2000, location: "C:/Users/Alex/Video" },
		{ name: 'file3.mp4', size: 3000, location: "C:/Users/Alex/Video" },
		{ name: 'file4.mp4', size: 4000, location: "C:/Users/Alex/Video" },
		{ name: 'file5.mp4', size: 5000, location: "C:/Users/Alex/Video" },
		{ name: 'file6.mp4', size: 6000, location: "C:/Users/Alex/Video" },
		{ name: 'file1.mp4', size: 1000, location: "C:/Users/Alex/Video" },
		{ name: 'file2.mp4', size: 2000, location: "C:/Users/Alex/Video" },
		{ name: 'file3.mp4', size: 3000, location: "C:/Users/Alex/Video" },
		{ name: 'file4.mp4', size: 4000, location: "C:/Users/Alex/Video" },
		{ name: 'file5.mp4', size: 5000, location: "C:/Users/Alex/Video" },
		{ name: 'file6.mp4', size: 6000, location: "C:/Users/Alex/Video" },
		{ name: 'file1.mp4', size: 1000, location: "C:/Users/Alex/Video" },
		{ name: 'file2.mp4', size: 2000, location: "C:/Users/Alex/Video" },
		{ name: 'file3.mp4', size: 3000, location: "C:/Users/Alex/Video" },
		{ name: 'file4.mp4', size: 4000, location: "C:/Users/Alex/Video" },
		{ name: 'file5.mp4', size: 5000, location: "C:/Users/Alex/Video" },
		{ name: 'file6.mp4', size: 6000, location: "C:/Users/Alex/Video" },
		{ name: 'file1.mp4', size: 1000, location: "C:/Users/Alex/Video" },
		{ name: 'file2.mp4', size: 2000, location: "C:/Users/Alex/Video" },
		{ name: 'file3.mp4', size: 3000, location: "C:/Users/Alex/Video" },
		{ name: 'file4.mp4', size: 4000, location: "C:/Users/Alex/Video" },
		{ name: 'file5.mp4', size: 5000, location: "C:/Users/Alex/Video" },
		{ name: 'file6.mp4', size: 6000, location: "C:/Users/Alex/Video" }
	]

	constructor(private changeDetector: ChangeDetectorRef) {
		this.sortOptions = [
			{label: 'A-Z', value: 'name'},
            {label: 'Z-A', value: '!name'}
        ];
	}

	removeFile(file: any) {
		this.files = this.files.filter(f => f !== file);
	}

	filter(event: any) {
		this.dv.filter(event?.target.value)
	}

	//Terrible default code from PrimeNG but works for now
	onSortChange(event) {
        let value = event.value;

        if (value.indexOf('!') === 0) {
            this.sortOrder = -1;
            this.sortField = value.substring(1, value.length);
        }
        else {
            this.sortOrder = 1;
            this.sortField = value;
        }
    }
}
