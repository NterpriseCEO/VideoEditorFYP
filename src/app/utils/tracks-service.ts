import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Filter, FilterInstance } from './interfaces';

@Injectable({
	providedIn: 'root'
})
export class TracksService {
	
	//Subject to add filter to the current track
	public addFilterSubject = new Subject<FilterInstance>;

	constructor() { }

	addFilter(filter: Filter) {
		//Creates a new instance of the filter and sets it to enabled
		let instance = Object.assign({}, filter, {enabled: true}) as FilterInstance;
		//Emits the new filter instance to the subject (the tracks panel)
		this.addFilterSubject.next(instance);
	}
}