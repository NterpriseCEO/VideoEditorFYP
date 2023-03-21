import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyingTracksComponent } from './modifying-tracks.component';

describe('ModifyingTracksComponent', () => {
  let component: ModifyingTracksComponent;
  let fixture: ComponentFixture<ModifyingTracksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModifyingTracksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyingTracksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
