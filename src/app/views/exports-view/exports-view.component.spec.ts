import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { ExportsViewComponent } from './exports-view.component';

describe('ExportsViewComponent', () => {
  let component: ExportsViewComponent;
  let fixture: ComponentFixture<ExportsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportsViewComponent ],
      providers: [
        MessageService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
