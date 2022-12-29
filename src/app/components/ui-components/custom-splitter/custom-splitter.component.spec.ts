import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSplitterComponent } from './custom-splitter.component';

describe('CustomSplitterComponent', () => {
  let component: CustomSplitterComponent;
  let fixture: ComponentFixture<CustomSplitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomSplitterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomSplitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
