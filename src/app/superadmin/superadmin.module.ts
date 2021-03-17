import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ng2-validation';

import { SuperAdminRoutingModule } from "./superadmin-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from "../shared/directives/match-height.directive";

import { DashboardSuperAdminComponent } from "./dashboard-superadmin/dashboard-superadmin.component";
import { ManageFaqsComponent } from "./manage-faqs/manage-faqs.component";
import { TranslationsComponent } from "./translations/translations.component";
import { GroupComponent } from "./groups/groups.component";
import { LangsComponent } from "./langs/langs.component";
import { PhenotypesComponent } from "./phenotypes/phenotypes.component";
import { PromsComponent } from "./proms/proms.component";
import { NotificationsSAComponent } from "./notifications-superadmin/notifications-superadmin.component";
import { SupportComponent } from './support/support.component';

import { UiSwitchModule } from 'ngx-ui-switch';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule} from '@angular/material';


@NgModule({
    imports: [
        CommonModule,
        SuperAdminRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        FormsModule,
        CustomFormsModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        UiSwitchModule,
        NgxDatatableModule
    ],
    exports: [TranslateModule],
    declarations: [
        DashboardSuperAdminComponent,
        ManageFaqsComponent,
        TranslationsComponent,
        GroupComponent,
        LangsComponent,
        PhenotypesComponent,
        PromsComponent,
        NotificationsSAComponent,
        SupportComponent
    ],
    providers: [],
})
export class SuperAdminModule { }
