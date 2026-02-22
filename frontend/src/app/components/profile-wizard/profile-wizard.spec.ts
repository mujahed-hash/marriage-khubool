import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileWizardComponent } from './profile-wizard';
import { ProfileService } from '../../services/profile';
import { provideRouter } from '@angular/router';

describe('ProfileWizardComponent', () => {
    let component: ProfileWizardComponent;
    let fixture: ComponentFixture<ProfileWizardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProfileWizardComponent],
            providers: [
                ProfileService,
                provideRouter([])
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ProfileWizardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start at step 1', () => {
        expect(component.currentStep()).toBe(1);
    });
});
