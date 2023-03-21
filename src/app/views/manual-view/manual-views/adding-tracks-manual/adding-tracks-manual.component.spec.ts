import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddingTracksManualComponent } from './adding-tracks-manual.component';

describe('AddingTracksManualComponent', () => {
  let component: AddingTracksManualComponent;
  let fixture: ComponentFixture<AddingTracksManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddingTracksManualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddingTracksManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
