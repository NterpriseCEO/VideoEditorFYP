import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
	selector: 'app-custom-splitter',
	templateUrl: './custom-splitter.component.html',
	styleUrls: ['./custom-splitter.component.scss']
})
export class CustomSplitterComponent implements AfterViewInit {

	@ViewChild('splitter') splitter!: ElementRef;

	@ViewChild('gutter') gutter!: ElementRef;

	@ViewChild('panel1') panel1!: ElementRef;
	@ViewChild('panel2') panel2!: ElementRef;

	// If the mouse is currently dragging the gutter
	isDragging: boolean = false;

	height: string = '100%';
	@Input() panelSizes: number[] = [50, 50];

	constructor() { }

	ngAfterViewInit() {
		this.setPanelSizes();
	}


	onDragStart() {
		this.isDragging = true;
	}

	onDrag(event: MouseEvent) {
		if(!this.isDragging) {
			return;
		}
		//Check if teh mouse is within 20px of the gutter y position
		if(event.clientY < this.gutter.nativeElement.getBoundingClientRect().top - 20 ||
			event.clientY > this.gutter.nativeElement.getBoundingClientRect().bottom + 20) {
			return;
		}
		//resize the panels
		this.resizePanels(event.clientY);
	}
	onDragEnd() {
		this.isDragging = false;
	}

	setPanelSizes() {
		//Sets the size of both panels based on the panelSizes array
		this.panel1.nativeElement.style.height = this.panelSizes[0] + '%';
		this.panel2.nativeElement.style.height = this.panelSizes[1] + '%';
	}

	resizePanels(y: number) {
		//Gets the boudning rect of the first panel
		const panel1Rect = this.panel1.nativeElement.getBoundingClientRect();
		//Sets the height of panel1 to be a percentage of the total height of the splitter
		let panel1Height = Math.max(0, Math.min(100, (y - panel1Rect.top) /
		this.splitter.nativeElement.clientHeight * 100));
		this.panel1.nativeElement.style.height = panel1Height + '%';
		//Sets the height of panel2 to take up the remaining space
		this.panel2.nativeElement.style.height = 100 - panel1Height + '%';
	}
}
