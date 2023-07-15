import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnChanges, SimpleChanges} from "@angular/core";

@Component({
	selector: "app-custom-splitter",
	templateUrl: "./custom-splitter.component.html",
	styleUrls: ["./custom-splitter.component.scss"]
})
export class CustomSplitterComponent implements AfterViewInit, OnChanges {

	@ViewChild("splitter") splitter!: ElementRef;

	@ViewChild("gutter") gutter!: ElementRef;

	@ViewChild("panel1") panel1!: ElementRef;
	@ViewChild("panel2") panel2!: ElementRef;

	// If the mouse is currently dragging the gutter
	isDragging: boolean = false;

	height: string = "100%";
	@Input() panelSizes: number[] = [50, 50];

	@Input() stateKey: string = "";
	@Input() horizontal: boolean = false;
	@Input() disabled: boolean = false;

	constructor() { }

	ngAfterViewInit() {
		//Populates the panelSizes array from local storage if it exists
		if(this.stateKey && localStorage.getItem(this.stateKey)) {
			this.panelSizes = JSON.parse(localStorage.getItem(this.stateKey) ?? "[]");
		}

		this.setPanelSizes();
	}

	ngOnChanges() {
		//If the panelSizes array has been repopulated from the parent
		//set the panel sizes
		if(this.panel1 && this.panel2) {
			this.setPanelSizes();
		}
	}


	onDragStart(event: MouseEvent) {
		//Checks if the mouse is within 20px of the gutter
		//Prevents the gutter from being dragged when
		//the mouse click started outside the gutter
		//but the mouse then later hovers over the gutter
		if(!this.isDraggingGutter(event) || this.disabled) {
			return;
		}
		this.isDragging = true;
	}

	onDrag(event: MouseEvent) {
		if(!this.isDragging) {
			return;
		}
		if(this.horizontal) {
			this.resizePanels(event.clientX);
		}else {
			this.resizePanels(event.clientY);
		}
	}
	onDragEnd() {
		this.isDragging = false;

		if(this.stateKey) {
			window.localStorage.setItem(this.stateKey, JSON.stringify(this.panelSizes));
		}
	}

	setPanelSizes() {
		//Sets the size of both panels based on the panelSizes array
		if(this.horizontal) {
			this.panel1.nativeElement.style.width = this.panelSizes[0] + "%";
			this.panel2.nativeElement.style.width = this.panelSizes[1] + "%";
		}else {
			this.panel1.nativeElement.style.height = this.panelSizes[0] + "%";
			this.panel2.nativeElement.style.height = this.panelSizes[1] + "%";
		}
	}

	resizePanels(xy: number) {
		if(this.horizontal) {
			//Gets the boudning rect of the first panel
			const panel1Rect = this.panel1.nativeElement.getBoundingClientRect();
			//Sets the width of panel1 to be a percentage of the total width of the splitter
			let panel1Width = Math.max(0, Math.min(100, (xy - panel1Rect.left) /
			this.splitter.nativeElement.clientWidth * 100));
			this.panel1.nativeElement.style.width = panel1Width + "%";
			//Sets the width of panel2 to take up the remaining space
			this.panel2.nativeElement.style.width = 100 - panel1Width + "%";

			//Sets the panelSizes array which is access by onDragEnd
			this.panelSizes = [panel1Width, 100 - panel1Width];
		}else {
			//Gets the boudning rect of the first panel
			const panel1Rect = this.panel1.nativeElement.getBoundingClientRect();
			//Sets the height of panel1 to be a percentage of the total height of the splitter
			let panel1Height = Math.max(0, Math.min(100, (xy - panel1Rect.top) /
			this.splitter.nativeElement.clientHeight * 100));
			this.panel1.nativeElement.style.height = panel1Height + "%";
			//Sets the height of panel2 to take up the remaining space
			this.panel2.nativeElement.style.height = 100 - panel1Height + "%";

			//Sets the panelSizes array which is access by onDragEnd
			this.panelSizes = [panel1Height, 100 - panel1Height];
		}
	}

	isDraggingGutter(event: MouseEvent) {
		if(this.horizontal) {
			//Checks if the mouse is within 20px of the gutter x position
			return event.clientX > this.gutter.nativeElement.getBoundingClientRect().left - 20 &&
			event.clientX < this.gutter.nativeElement.getBoundingClientRect().right + 20;
		}else {
			//Checks if the mouse is within 20px of the gutter y position
			return event.clientY > this.gutter.nativeElement.getBoundingClientRect().top - 20 &&
			event.clientY < this.gutter.nativeElement.getBoundingClientRect().bottom + 20;
		}
	}
}
