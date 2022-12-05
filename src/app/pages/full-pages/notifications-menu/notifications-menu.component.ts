import { Component, ViewChild, OnInit, ElementRef, OnDestroy, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { SortService} from 'app/shared/services/sort.service';
import {DateAdapter} from '@angular/material/core';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { Router, NavigationStart } from '@angular/router';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { LangService } from 'app/shared/services/lang.service';
import { AlertsService } from 'app/shared/services/alerts.service';
import { PatientService } from 'app/shared/services/patient.service';
import swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Injectable, Injector } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import * as jsPDF from 'jspdf'
import { DatePipe } from '@angular/common';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { RequestOptions } from '@angular/http';
import { id } from '@swimlane/ngx-datatable/release/utils';
//import { NavbarComponent } from 'app/shared/navbar/navbar.component';
//import { FullLayoutComponent } from 'app/layouts/full/full-layout.component';

@Component({
    selector: 'app-notifications-menu',
    templateUrl: './notifications-menu.component.html',
    styleUrls: ['./notifications-menu.component.scss'],
    providers: [LangService, PatientService]
})

@Injectable()
export class NotificationsMenuComponent implements OnInit, OnDestroy {
    //Variable Declaration
    @ViewChild('f') userForm: NgForm;
    @ViewChild('fPass') passwordForm: NgForm;

    //@ViewChild('appnavbar') navbarHTML: FullLayoutComponent;
    //@Output() messageEvent = new EventEmitter<string>();

    modalReference: NgbModalRef;
    public user: any;
    private userCopy: AnalyserNode;
    langs: any;
    private msgDataSavedOk: string;
    private msgDataSavedFail: string;
    private msgDownload: string;
    loading: boolean = false;
    loadingSubscription: boolean = false;
    sending: boolean = false;
    activeTittleMenu: string='Notifications';
    msgActiveTittleMenu: string;
    item: number = 0;
    tittleGeneral: string = '';
    tittlePassword: string = '';
    snoozeMonths:any = [];
    tittleNotifications: string = '';
    tittleSubscriptions: string = '';
    credentials: any = {};
    alertsNotRead: any = [];
    alertsRead: any = [];
    userGroup: any;
    groupsInfo: any;
    listOfAlertsForThisUserTypeGroup:any=[];
    listOfAlertsForThisUserType6:any=[];
    listOfAlertsForThisUserType12:any=[];

    patientId: string ='';
    dateNow;
    listNotificationsByGroup: any = [];
    snoozeAlertSelected:any;
    eventSend: any;
    groupName:any;
    duchenneinternational: string = globalvars.duchenneinternational;

    private subscription: Subscription = new Subscription();

    constructor(private http: HttpClient, private patientService: PatientService, private alertService:AlertsService, private modalService: NgbModal, private datePipe: DatePipe, private authService: AuthService, public toastr: ToastsManager, public translate: TranslateService, private authGuard: AuthGuard, private langService:LangService, private elRef: ElementRef, private router: Router, private dateService: DateService, private inj: Injector) {
      this.loading = true;
      this.groupName = this.authService.getGroup();
      //obter las lista de idiomas
      this.loadLanguages();
      //this.loadAlertsData();

      this.listOfAlertsForThisUserTypeGroup=[];
      this.listOfAlertsForThisUserType6=[];
      this.listOfAlertsForThisUserType12=[];
      this.listNotificationsByGroup=[];

      router.events.filter(event => event instanceof NavigationStart)
      .subscribe((event:NavigationStart) => {
        var eventsAlert = this.inj.get(AlertsService);
        eventsAlert.broadcast('changeNotificationStatus', this.alertsNotRead);
        // You only receive NavigationStart events
      });
    }

    ngOnDestroy() {
       this.subscription.unsubscribe();
    }

    loadLanguages() {
       this.subscription.add( this.langService.getLangs()
       .subscribe( (res : any) => {
         this.langs=res;
       }));
    }

    ngOnInit() {

      this.listOfAlertsForThisUserTypeGroup=[];
      this.listOfAlertsForThisUserType6=[];
      this.listOfAlertsForThisUserType12=[];
      this.listNotificationsByGroup=[];

      this.loading = true;

      this.dateNow=new Date();

      this.subscription.add( this.translate.onLangChange.subscribe((event: { lang: string, translations: any }) => {
        this.loadTranslations();
      }));

      this.loadTranslations();

      this.credentials = {
        password: '',
        password2: '',
        actualpassword: ''
      };

      //cargar los datos del usuario
      this.subscription.add( this.http.get(environment.api+'/api/users/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.user = res.user;
        this.userGroup = res.user.group
        this.userCopy = JSON.parse(JSON.stringify(res.user));

        //cargar los ficheros de traducciones del proms
        this.loadAlertsSubscriptionData();
        this.loadNotificationStatus();

       }, (err) => {
         console.log(err);
         this.loading = false;
       }));
    }

    navigateWithParams(route,param){
      this.router.navigate([route, {section: param}]);
    }

    // Obtener la lista de alertas para el paciente
    loadAlertsSubscriptionData(){
      this.loadingSubscription = true;

      this.listOfAlertsForThisUserTypeGroup=[];
      this.listOfAlertsForThisUserType6=[];
      this.listOfAlertsForThisUserType12=[];
      this.listNotificationsByGroup=[];

      this.dateNow=new Date();
      var dateNowFormat=this.dateNow.getTime();

      this.groupName = this.authService.getGroup();
      var groupname=this.groupName;
      var lang=this.authService.getLang();
      var notificationsTranslateString=this.translate.instant("notificationsMenu.Notifications from");
      var subscriptionToGroupAlerts=true;



      this.subscription.add(this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.subscription.add( this.http.get(environment.api+'/api/patients/getSubscriptionToGroupAlerts/'+this.authService.getCurrentPatient().sub)
        .subscribe( (res1 : any) => {
          subscriptionToGroupAlerts=res1.subscription;
        }, (err) => {
          console.log(err);
        }));


        if(res.listpatients.length>0){
          this.patientId=res.listpatients[0].sub;
          this.subscription.add( this.http.get(environment.api+'/api/alerts/patient/'+res.listpatients[0].sub)
          .subscribe( (res2 : any) => {
            var groupSubscription = false;
            var listTypeGroup=[];
            var listType6=[];
            var listType12=[];
            var list2 =[];
            if(res2.message==undefined){
              res2.forEach(function(alertForUser) {
                if((alertForUser.alert!=null)&&(alertForUser.alert!=undefined)&&(alertForUser.alert!=[])&&(alertForUser.alert!="")){
                  if(alertForUser.alert.type==groupname){
                    if((alertForUser.alert.endDate!=null)&&(alertForUser.alert.endDate!=undefined)&&(alertForUser.alert.endDate!=[])&&(alertForUser.alert.endDate!="")){
                      if((Date.parse(alertForUser.alert.launchDate)<=dateNowFormat)&&(Date.parse(alertForUser.alert.endDate)>=dateNowFormat)){
                        list2.unshift(alertForUser);
                        if(groupSubscription==false){
                          listTypeGroup.unshift({name:notificationsTranslateString, alertForUser, subscription:alertForUser.subscription})
                          groupSubscription=true;
                        }
                      }
                    }
                    else{
                      if(Date.parse(alertForUser.alert.launchDate)<=dateNowFormat){
                        list2.unshift(alertForUser);
                        if(groupSubscription==false){
                          listTypeGroup.unshift({name:notificationsTranslateString, alertForUser,subscription:alertForUser.subscription})
                          groupSubscription=true;
                        }
                      }
                    }

                  }
                  else if(alertForUser.alert.type!=groupname){

                    var nameSubs = "";
                    for (var i =0; i < alertForUser.alert.translatedName.length;i++){
                      if(alertForUser.alert.translatedName[i].code == lang){
                        nameSubs=alertForUser.alert.translatedName[i].title;
                      }
                    }
                    if(nameSubs!=""){
                      if((alertForUser.alert.endDate!=null)&&(alertForUser.alert.endDate!=undefined)&&(alertForUser.alert.endDate!=[])&&(alertForUser.alert.endDate!="")){
                        if((Date.parse(alertForUser.alert.launchDate)<=dateNowFormat)&&(Date.parse(alertForUser.alert.endDate)>=dateNowFormat)){
                          switch(alertForUser.alert.type){
                            case '6months':
                              listType6.unshift({name:nameSubs,alertForUser,subscription:alertForUser.subscription})
                              break;
                            case '12months':
                              listType12.unshift({name:nameSubs,alertForUser,subscription:alertForUser.subscription})
                              break;
                          }
                        }
                      }
                      else{
                        if(Date.parse(alertForUser.alert.launchDate)<=dateNowFormat){
                          switch(alertForUser.alert.type){
                            case '6months':
                              listType6.unshift({name:nameSubs,alertForUser,subscription:alertForUser.subscription})
                              break;
                            case '12months':
                              listType12.unshift({name:nameSubs,alertForUser,subscription:alertForUser.subscription})
                              break;
                          }
                        }
                      }

                    }

                  }

                }


              });
            }

            if(listTypeGroup.length>0){
              this.listOfAlertsForThisUserTypeGroup=listTypeGroup;
            }
            else{
              this.listOfAlertsForThisUserTypeGroup=[{name:notificationsTranslateString,alertForUser:{alert:{type:groupname}}, subscription:subscriptionToGroupAlerts}];
            }
            this.listOfAlertsForThisUserType6=listType6;
            this.listOfAlertsForThisUserType12=listType12;
            this.listNotificationsByGroup=list2;

            this.loadingSubscription=false;

          }, (err) => {
            console.log(err);
          }));
        }
      }, (err) => {
        console.log(err);
      }));



    }

    loadNotificationStatus(){
      this.loading = true;

      this.alertsNotRead=[];
      this.alertsRead=[];

      if(this.authService.getRole()=='User'){
        this.subscription.add( this.patientService.getPatientId()
        .subscribe( (res : any) => {
          if(res!=null){
            this.subscription.add(this.alertService.loadAlertsNotReadAndTranslateName(res,false)
            .subscribe( (res2 : any) => {
              if(res2){
                this.alertsNotRead=this.alertService.getListAlertsNotRead();
                this.subscription.add(this.alertService.loadAlertsReadAndTranslateName(res,false)
                .subscribe( (res3 : any) => {
                  if(res3){
                    this.alertsRead=this.alertService.getListAlertsRead();
                    this.loading = false;
                    this.setNotificationsStateToRead();

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

    setNotificationsStateToRead(){
      if(this.authService.getRole()=='User'){
        this.subscription.add( this.patientService.getPatientId()
        .subscribe( (res : any) => {
          if(res!=null){
            this.subscription.add(this.alertService.updateStateToReadOfUserAlerts(res.sub,this.alertsNotRead)
            .subscribe( (res1: any) => {
              if(res1){
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

    snoozeClick(option,value){
      var numberMonthsToSnooze=0;
      numberMonthsToSnooze=value;
      var alertId;

      // El snooze solo se puede hacer en las de tipo 6 o 12 meses
      switch(option){
        case '6':
          for(var i = 0; i<this.listOfAlertsForThisUserType6.length;i++){
            if((this.listOfAlertsForThisUserType6[i].alertForUser.alert.identifier==this.snoozeAlertSelected.alertFound.identifier)
              &&(this.listOfAlertsForThisUserType6[i].alertForUser.alert.type==this.snoozeAlertSelected.alertFound.type)){
              alertId=this.listOfAlertsForThisUserType6[i].alertForUser.alert._id;
            }
          }
          break;
        case '12':
          for(var i = 0; i<this.listOfAlertsForThisUserType12.length;i++){
            if((this.listOfAlertsForThisUserType12[i].alertForUser.alert.identifier==this.snoozeAlertSelected.alertFound.identifier)
            &&(this.listOfAlertsForThisUserType12[i].alertForUser.alert.type==this.snoozeAlertSelected.alertFound.type)){
              alertId=this.listOfAlertsForThisUserType12[i].alertForUser.alert._id;
            }
          }
          break;
      }


      if(alertId!=undefined){
        // Find the alert for this patient anc change in the userAlert the property launchDate
        this.subscription.add(this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
        .subscribe( (res : any) => {
          if(res.listpatients.length>0){
            this.patientId=res.listpatients[0].sub;
            var params = this.patientId+'-code-'+alertId;
            this.subscription.add( this.http.get(environment.api+'/api/useralerts/alertId/'+params)
            .subscribe( (res2 : any) => {
              if(res2.showDate!=undefined){
                var date = new Date();
                var month = date.getMonth();
                var newMonthToShow = Number(month)+Number(numberMonthsToSnooze);
                date.setMonth(newMonthToShow);

                // Update show date of this userAlert
                res2.showDate = date;
                this.subscription.add( this.http.post(environment.api+'/api/useralerts/'+this.patientId,res2)
                .subscribe( (res1 : any) => {
                    this.subscription.add(this.http.get(environment.api+'/api/alerts/alertId/'+res2.alertId).subscribe((resAlert:any)=>{
                      if(resAlert){
                        var alertNotRead=false;
                        for(var i =0; i<this.alertsNotRead.length;i++){
                          if((this.alertsNotRead[i].alertFound.identifier==resAlert.identifier)&&(this.alertsNotRead[i].alertFound.type==resAlert.type)){
                            this.alertsNotRead.splice(i,1);
                            alertNotRead=true;
                          }
                        }
                        if(alertNotRead==false){
                          for(var i =0; i<this.alertsRead.length;i++){
                            if((this.alertsRead[i].alertFound.identifier==resAlert.identifier)&&(this.alertsRead[i].alertFound.type==resAlert.type)){
                              this.alertsRead.splice(i,1);
                            }
                          }
                        }
                        //this.setNotificationsStateToRead();
                        var eventsAlert = this.inj.get(AlertsService);
                        eventsAlert.broadcast('changeNotificationStatus', this.alertsNotRead);
                        this.modalReference.close();

                      }
                    }, (err) => {
                      console.log(err);
                    }));

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

    resetAlertsSubscriptions() {
      this.loading = true;
      this.loadAlertsSubscriptionData();
      this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
      this.loading = false;
    }

    selectSubscriptions(type) {
      switch(type){
        case "select":
          for ( var i=0;i<this.listOfAlertsForThisUserTypeGroup.length;i++){
            this.listOfAlertsForThisUserTypeGroup[i].subscription=true;
          }
          for ( var i=0;i<this.listOfAlertsForThisUserType6.length;i++){
            this.listOfAlertsForThisUserType6[i].subscription=true;
          }
          for ( var i=0;i<this.listOfAlertsForThisUserType12.length;i++){
            this.listOfAlertsForThisUserType12[i].subscription=true;
          }
          break;
        case "deselect":
          for ( var i=0;i<this.listOfAlertsForThisUserTypeGroup.length;i++){
            this.listOfAlertsForThisUserTypeGroup[i].subscription=false;
          }
          for ( var i=0;i<this.listOfAlertsForThisUserType6.length;i++){
            this.listOfAlertsForThisUserType6[i].subscription=false;
          }
          for ( var i=0;i<this.listOfAlertsForThisUserType12.length;i++){
            this.listOfAlertsForThisUserType12[i].subscription=false;
          }
          break;
      }
    }

    onSubmitAlerts(){
      this.sending = true;
      this.loading = true;
      var groupName = this.authService.getGroup();

      var listOfAlertsByGroup = this.listNotificationsByGroup;

      var listUserAlertsToSave=[];
      var listUserAlertsToDelete=[];

      var listOfAlertsForThisUser = [];

      for(var i=0;i<this.listOfAlertsForThisUserTypeGroup.length;i++){
        listOfAlertsForThisUser.push(this.listOfAlertsForThisUserTypeGroup[i])
      }
      for(var i=0;i<this.listOfAlertsForThisUserType6.length;i++){
        listOfAlertsForThisUser.push(this.listOfAlertsForThisUserType6[i])
      }
      for(var i=0;i<this.listOfAlertsForThisUserType12.length;i++){
        listOfAlertsForThisUser.push(this.listOfAlertsForThisUserType12[i])
      }

     var deleteSubscriptionGroupAlerts=false;

      for (var i=0; i<listOfAlertsForThisUser.length;i++){

        if ((listOfAlertsForThisUser[i]!= undefined)){
          // USER ALERTS DE TIPO GRUPO
          if((listOfAlertsForThisUser[i].alertForUser.alert.type==groupName)){

            if((listOfAlertsForThisUser[i].subscription==true)){
              deleteSubscriptionGroupAlerts=false;
              for (var j =0; j<listOfAlertsByGroup.length;j++){
                if(listOfAlertsByGroup[j].alert._id!=undefined){
                  var newUserAlertForPatient={
                    "alertId": listOfAlertsByGroup[j].alert._id,
                    "state": "Not read",
                    "patientId":this.patientId,
                    "showDate": listOfAlertsByGroup[j].alert.launchDate,
                    "launch":false
                  }
                  listUserAlertsToSave.unshift(newUserAlertForPatient);
                }
              }
            }
            else{
              deleteSubscriptionGroupAlerts=true;
              for (var j =0; j<listOfAlertsByGroup.length;j++){
                if(listOfAlertsByGroup[j].alert._id!=undefined){
                  listUserAlertsToDelete.unshift(listOfAlertsByGroup[j].alert);
                }
              }
            }
          }
          // USER ALERTS DE TIPO DISTINTO A GRUPO
          else{
            //En el caso de que sean otras alertas
            if(listOfAlertsForThisUser[i].subscription==true){
              var newUserAlertForPatient2={
                "alertId": listOfAlertsForThisUser[i].alertForUser.alert._id,
                "state": "Not read",
                "patientId":this.patientId,
                "showDate": listOfAlertsForThisUser[i].alertForUser.alert.launchDate,
                "launch":false
              }
              listUserAlertsToSave.unshift(newUserAlertForPatient2);


            }
            else if(listOfAlertsForThisUser[i].subscription==false){
              listUserAlertsToDelete.unshift(listOfAlertsForThisUser[i].alertForUser.alert)
            }
          }
        }
      }

      if(deleteSubscriptionGroupAlerts==false){
        this.subscription.add( this.http.post(environment.api+'/api/patients/updateSubscriptionTrue/'+this.authService.getCurrentPatient().sub,"")
        .subscribe( (res1 : any) => {
        }, (err) => {
          console.log(err);
        }));
      }
      else if(deleteSubscriptionGroupAlerts==true){
        this.subscription.add( this.http.post(environment.api+'/api/patients/updateSubscriptionFalse/'+this.authService.getCurrentPatient().sub,"")
        .subscribe( (res1 : any) => {
        }, (err) => {
          console.log(err);
        }));
      }

      for (var i = 0; i< listUserAlertsToSave.length;i++){
        this.subscription.add( this.http.post(environment.api+'/api/useralerts/checkingReceiver/'+this.patientId,listUserAlertsToSave[i])
        .subscribe( (res1 : any) => {
        }, (err) => {
          console.log(err);
        }));

      }

      for (var i = 0; i< listUserAlertsToDelete.length;i++){
        var params = this.patientId+'-code-'+listUserAlertsToDelete[i]._id;
        this.subscription.add( this.http.delete(environment.api+'/api/useralerts/alertId/'+params)
        .subscribe( (res1 : any) => {
        }, (err) => {
          console.log(err);
        }));
      }

      this.loading = false;
      this.sending = false;
      this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
      this.loadNotificationStatus();
      var eventsAlert = this.inj.get(AlertsService);
      eventsAlert.broadcast('changeNotificationStatus', ["Bot change number of alerts"]);
    }

    //traducir cosas
    loadTranslations(){
      this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
        this.msgDataSavedOk=res;
      });
      this.translate.get('generics.Data saved fail').subscribe((res: string) => {
        this.msgDataSavedFail=res;
      });
      this.translate.get('profile.General').subscribe((res: string) => {
        this.tittleGeneral=res;
      });
      this.translate.get('generics.Password').subscribe((res: string) => {
        this.tittlePassword=res;
      });
      this.translate.get('menu.Notifications').subscribe((res: string) => {
        this.tittleNotifications=res;
        this.msgActiveTittleMenu = this.tittleNotifications;
      });
      this.translate.get('generics.Subscriptions').subscribe((res: string) => {
        this.tittleSubscriptions=res;
      });

    }

    onChangeLang(newValue, index) {
      this.translate.use(newValue);
    }

    subscriptionchangedEvent(eachAlertAndState, event){
      for ( var i=0;i<this.listOfAlertsForThisUserTypeGroup.length;i++){
        if(this.listOfAlertsForThisUserTypeGroup[i]==eachAlertAndState){
          this.listOfAlertsForThisUserTypeGroup[i].subscription=event;
        }
      }
      for ( var i=0;i<this.listOfAlertsForThisUserType6.length;i++){
        if(this.listOfAlertsForThisUserType6[i]==eachAlertAndState){
          this.listOfAlertsForThisUserType6[i].subscription=event;
        }
      }
      for ( var i=0;i<this.listOfAlertsForThisUserType12.length;i++){
        if(this.listOfAlertsForThisUserType12[i]==eachAlertAndState){
          this.listOfAlertsForThisUserType12[i].subscription=event;
        }
      }
    }

    resetForm() {
      this.user= JSON.parse(JSON.stringify(this.userCopy));
      this.translate.use(this.user.lang);
      this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
    }

    submitInvalidForm() {
      if (!this.userForm) { return; }
      const base = this.userForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    SetActive(event, panelId: string) {
      var hElement: HTMLElement = this.elRef.nativeElement;
      //now you can simply get your elements with their class name
      var allAnchors = hElement.getElementsByClassName('list-group-item');
      //do something with selected elements
      [].forEach.call(allAnchors, function (item: HTMLElement) {
        item.setAttribute('class', 'list-group-item no-border');
      });
      //set active class for selected item
      event.currentTarget.setAttribute('class', 'list-group-item bg-blue-grey bg-lighten-5 border-right-primary border-right-2');

      if (panelId === 'PanelNotifications') {
        this.activeTittleMenu = "Notifications";
        this.msgActiveTittleMenu = this.tittleNotifications;
      }
      else if (panelId === 'PanelSubscriptions') {
        this.activeTittleMenu = "Subscriptions";
        this.msgActiveTittleMenu = this.tittleSubscriptions;
      }

      $('.content-overlay').removeClass('show');
      $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
      $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');

    }

    toggleMenu(){
      if($('.chat-app-sidebar-toggle').hasClass('ft-align-justify')){
        $('.chat-app-sidebar-toggle').removeClass('ft-align-justify').addClass('ft-x');
        $('.chat-sidebar').removeClass('d-none d-sm-none').addClass('d-block d-sm-block');
        $('.content-overlay').addClass('show');
      }else{
        $('.content-overlay').removeClass('show');
        $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
        $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');
      }
    }

    OpenPanelSelecSnooze6(selectSnooze6,alert){
      this.snoozeAlertSelected=alert;
      //Abrira la ventana emergente mostrando dos entradas de texto: valor minimo y valor maximo de score
      let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
        keyboard : false
      };
      this.modalReference = this.modalService.open(selectSnooze6,  { windowClass: 'md-class'});

    }

    OpenPanelSelecSnooze12(selectSnooze12,alert){
      this.snoozeAlertSelected=alert;
      //Abrira la ventana emergente mostrando dos entradas de texto: valor minimo y valor maximo de score
      let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
        keyboard : false
      };
      this.modalReference = this.modalService.open(selectSnooze12, { windowClass: 'md-class'});

    }

}
