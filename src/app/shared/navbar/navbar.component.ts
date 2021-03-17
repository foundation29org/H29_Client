import { Component, OnInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertsService } from 'app/shared/services/alerts.service';
import { Subscription } from 'rxjs/Subscription';
import { PatientService } from '../services/patient.service';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';




declare var device;
declare global {
    interface Navigator {
      app: {
          exitApp: () => any; // Or whatever is the type of the exitApp function
      }
    }
}

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    providers: [PatientService]
})

export class NavbarComponent implements OnInit {

    currentLang = 'en';
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    isAndroid: boolean = false;
    role: string;
    patients: any;
    currentPatient: any = {};
    group: string;
    alertsNotRead:any=[];
    alertsRead:any=[];
    notificationsRead:boolean=false;
    snoozeMonths:any;
    loading:boolean=false;
    alertsLoaded:boolean=false;


    private subscription: Subscription = new Subscription();

    @ViewChild('notificationsMenuEvent') mydrop;
    @ViewChild('CustomizerEvent') mydrop1;

    @Output() onReadNotifications = new EventEmitter<void>();

    constructor(public translate: TranslateService,private http: HttpClient, private authService: AuthService, private router: Router, private route: ActivatedRoute,private patientService: PatientService, private alertService:AlertsService) {
      if (this.isApp){
        if(device.platform == 'android' || device.platform == 'Android'){
          this.isAndroid = true;
        }
      }
      this.group = this.authService.getGroup();
      this.notificationsRead=false;
    }


    ngOnInit(): void {
      this.loading=true;
      this.notificationsRead=false;
      this.alertService.on('changeNotificationStatus', function(notifications) {
        this.notificationsRead=false;
        this.loadNumberNotifications(false);

      }.bind(this));
      this.loadNumberNotifications(true);
    }

    loadNumberNotifications(updateIcon){
      this.alertsLoaded=true;
      if(updateIcon==true){
        this.loading=true;
      }
      this.alertsNotRead=[];

      if(this.authService.getRole()=='User'){
        this.subscription.add( this.patientService.getPatientId()
        .subscribe( (res : any) => {
          if(res!=null){
            var lang = this.authService.getLang();
            var params=res.sub+"-code-"+lang;
            this.subscription.add(this.http.get(environment.api+'/api/alerts/alertsNotRead/'+params).subscribe((res:any)=>{
              this.alertsLoaded=false;
              this.alertsNotRead=res;
              this.alertsLoaded=true;
              if(updateIcon==true){
                this.loading=false;
              }
            }, (err) => {
              console.log(err);
            }));
          }

        }, (err) => {
          console.log(err);
        }));
      }


    }

    loadListofAlertsAndState(updateIcon){
      if(updateIcon==true){
        this.loading=true;
      }

      this.alertsNotRead=[];
      this.alertsRead=[];
      if(this.authService.getRole()=='User'){
        this.subscription.add( this.patientService.getPatientId()
        .subscribe( (res : any) => {
          if(res!=null){
           this.subscription.add(this.alertService.loadAlertsNotReadAndTranslateName(res,updateIcon)
           .subscribe( (res2 : any) => {
              if(res2){
                this.alertsNotRead=this.alertService.getListAlertsNotRead();
                this.subscription.add(this.alertService.loadAlertsReadAndTranslateName(res,updateIcon)
                .subscribe( (res3 : any) => {
                  if(res3){
                    this.alertsRead=this.alertService.getListAlertsRead();
                    this.alertsLoaded=this.alertService.alertsLoaded;
                    if(updateIcon==true){
                      this.loading=false;
                    }
                  }
                }, (err) => {
                  console.log(err);
                }));

              }


            }, (err) => {
              console.log(err);
            }));
          }
         }, (err) => {
           console.log(err);
         }));
      }
    }

    snooze(){
    }

    snoozeSelect(event){
    }

    notificationsEvent(){
      this.alertsNotRead=[];
      this.loading = false;
      this.router.navigate(['/notifications-menu']);

    }

    logout() {
        this.authService.logout();
        this.router.navigate([this.authService.getLoginUrl()]);
    }

    exit() {
        navigator.app.exitApp();
    }

}
