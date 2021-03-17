import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ng2-validation';
import { FullPagesRoutingModule } from "./full-pages-routing.module";
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatSelectModule} from '@angular/material';
import { NotificationsMenuComponent } from "./notifications-menu/notifications-menu.component";
import { UserProfilePageComponent } from "./user-profile/user-profile-page.component";
import { SupportComponent } from './support/support.component';
import { UiSwitchModule } from 'ngx-ui-switch';


@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        FullPagesRoutingModule,
        FormsModule,
        NgbModule,
        TranslateModule,
        CustomFormsModule,
        MatSelectModule,
        UiSwitchModule
    ],
    declarations: [
        UserProfilePageComponent,
        NotificationsMenuComponent,
        SupportComponent
    ]
})
export class FullPagesModule { }
