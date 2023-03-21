import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingWithFiltersComponent } from './working-with-filters.component';

describe('WorkingWithFiltersComponent', () => {
  let component: WorkingWithFiltersComponent;
  let fixture: ComponentFixture<WorkingWithFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkingWithFiltersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingWithFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
