import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from "./admin-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from "../shared/directives/match-height.directive";
import { UiSwitchModule } from 'ngx-ui-switch';

import { DashboardAdminComponent } from "./dashboard-admin/dashboard-admin.component";

import { TranslationsComponent } from "./translations/translations.component";
import { UsersAdminComponent } from "./users-admin/users-admin.component";
import { StatisticsComponent } from "./statistics/statistics.component";
import { NotificationsComponent } from "./notifications/notifications.component";
import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule} from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SupportComponent } from './support/support.component';

@NgModule({
    imports: [
        CommonModule,
        AdminRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        FormsModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        UiSwitchModule,
        NgxDatatableModule
    ],
    exports: [TranslateModule],
    declarations: [
        DashboardAdminComponent,
        TranslationsComponent,
        UsersAdminComponent,
        StatisticsComponent,
        NotificationsComponent,
        SupportComponent
    ],
    providers: [],
})
export class AdminModule { }
