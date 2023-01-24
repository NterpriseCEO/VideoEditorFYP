import { Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { debounceTime, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class KeyboardEventsService {
	constructor(
		private eventManager: EventManager,
	) {}

	keypress(...keys: any[]): Observable<any> {
		return new Observable((observer) => {
			keys.forEach((keySqeuence) => {
				const eventHandler = (e) => {
					e.preventDefault();
					observer.next(e);
				};
				const disposeEvent = this.eventManager.addEventListener(
					document.body,
					keySqeuence,
					eventHandler
				);
				return () => {
					disposeEvent();
				};
			});
		}).pipe(debounceTime(100));
	}
}
