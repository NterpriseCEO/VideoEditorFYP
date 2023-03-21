import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportingClipsComponent } from './importing-clips.component';

describe('ImportingClipsComponent', () => {
  let component: ImportingClipsComponent;
  let fixture: ComponentFixture<ImportingClipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportingClipsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportingClipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
