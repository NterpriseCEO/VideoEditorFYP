import { Component, OnInit } from '@angular/core';
import { MenuItem, PrimeIcons } from 'primeng/api';

@Component({
	selector: 'app-editor-toolbar',
	templateUrl: './editor-toolbar.component.html',
	styleUrls: ['./editor-toolbar.component.scss']
})
export class EditorToollbarComponent implements OnInit {

	items:MenuItem[] = [
		{
			label: 'File',
			items: [
				{
					label: 'New Project',
					icon: PrimeIcons.PLUS,
					command: () => {
						alert("Creating a new project");
					}
				},
				{
					label: 'Open Project',
					icon: PrimeIcons.FILE,
					command: () => {
						alert("Opening a project");
					}
				},
				{
					label: 'Save Project',
					icon: PrimeIcons.SAVE,
					command: () => {
						alert("Saving the project");
					}
				},
				{
					label: 'Save Project As',
					icon: PrimeIcons.SAVE,
					command: () => {
						alert("Saving the project as");
					}
				},
				{
					label: 'Export Project',
					icon: 'pi pi-fw pi-file-export',
					command: () => {
						alert("Exporting the project");
					}
				}
			]
		},
		{
			label: 'Edit',
			items: [
				{
					label: 'Undo',
					icon: PrimeIcons.UNDO,
					command: () => {
						alert("Undoing");
					}
				},
				{
					label: 'Redo',
					icon: PrimeIcons.REFRESH,
					command: () => {
						alert("Redoing");
					}
				}
			]
		},
		{
			label: 'View',
			items: [
				{
					label: 'Blah',
					command: () => {
						alert("Blah");
					}
				},
				{
					label: 'Blah',
					command: () => {
						alert("Blah");
					}
				},
				{
					label: 'Blah',
					command: () => {
						alert("Blah");
					}
				}
			]
		}
	]

	constructor() { }

	ngOnInit(): void {
	}

}
