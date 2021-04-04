import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeSubmissionComponent } from './code-submission.component';

describe('CodeSubmissionComponent', () => {
  let component: CodeSubmissionComponent;
  let fixture: ComponentFixture<CodeSubmissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodeSubmissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
