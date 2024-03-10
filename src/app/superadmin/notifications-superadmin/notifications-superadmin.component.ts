import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { SortService} from 'app/shared/services/sort.service';
import {DateAdapter} from '@angular/material/core';
import { listener } from '@angular/core/src/render3/instructions';
import { NotificationsMenuComponent } from 'app/pages/full-pages/notifications-menu/notifications-menu.component';

@Component({
    selector: 'app-notifications-superadmin',
    templateUrl: './notifications-superadmin.component.html',
    styleUrls: ['./notifications-superadmin.component.scss']
})

export class NotificationsSAComponent implements OnInit, OnDestroy{
  @ViewChild('f') newAlertForm: NgForm;

  addedlang: boolean = false;
  lang: any;
  langsSelected: any = []
  translationsAdded: any;
  alertTranslations: any = [];
  alertTranslationsTitle: any = [];
  alertTranslationsUrl: any=[];
  alertAddressUrl:any=[];
  langs: any;
  langsShow: any = []
  messageTranslated: any
  sending: boolean = false;
  working: boolean = false;
  loadingNotifications: boolean = false;
  editNotification: boolean = false;
  alert: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  users: any = [];
  groups: any = [];
  groupSelected: any = "";
  currentGroup: any
  currentGroupId:any
  usersCopy: any = [];
  notifications: any = [];
  notificationsCopy: any = [];
  user: any = {};
  modalReference: NgbModalRef;
  timeformat: any
  createNotification: boolean = false;
  selectingLanguages: boolean = false;
  translateNameGroup:any=[];
  translateName6Months:any=[];
  translateName12Months:any=[];

  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient,public translate: TranslateService,private authService: AuthService,private authGuard: AuthGuard,public toastr: ToastsManager,private modalService: NgbModal,private dateService: DateService,private sortService: SortService,private blob: BlobStorageService,public searchFilterPipe: SearchFilterPipe,private adapter: DateAdapter<any>){
    //this.getNotifications();
    //this.loadingNotifications = false
    this.createNotification=true;
    this.editNotification=true;
    this.adapter.setLocale(this.authService.getLang());
    switch(this.authService.getLang()){
      case 'en':
        this.timeformat="M/d/yy";
        break;
      case 'es':
          this.timeformat="d/M/yy";
          break;
      case 'nl':
          this.timeformat="d-M-yy";
          break;
      default:
          this.timeformat="M/d/yy";
          break;

    }

  }

  emptyAlert(){
    this.alert = {
      type: '',
      endDate: null,
      launchDate: null,
      url:[],
      //role: '',
      //priority: '',
      //color: '',
      //logo: '',
      identifier: '',
      translatedName: []
    };
    this.alertAddressUrl=[];

  }

  ngOnInit() {
    this.createNotification=true;
    this.editNotification=true;
    this.getLangs();
    this.emptyAlert()
    this.loadTranslations();
    this.adapter.setLocale(this.authService.getLang());
    this.loadGroups()
    this.createNotification=false;
    this.editNotification=false;

  }


  loadGroups() {
    //cargar los grupos actuales
    this.groupSelected = ""
    this.subscription.add( this.http.get(environment.api+'/api/groups/')
    .subscribe( (res : any) => {
      this.groups = res;
     }, (err) => {
       console.log(err);
     }));
  }

  //traducir cosas
  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });
  }

  onChangeGroup(group){
    this.currentGroup = this.groupSelected.name
    this.currentGroupId = this.groupSelected._id
    this.getNotifications();
    //this.loadingNotifications = false

  }

  submitInvalidForm() {
    if (!this.newAlertForm) { return; }
    const base = this.newAlertForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  emptyForm(){
    this.selectingLanguages = false
    this.langsSelected = []
    this.alertTranslations = []
    this.alertTranslationsTitle=[];
    for(var i =0;i<this.langs.length;i++){
      this.alertTranslationsUrl[i]={data:[]};
    }

    this.langsShow.forEach(element => {
      element.value = false
    });
    this.emptyAlert();
  }

  onSubmit() {
    if(this.authGuard.testtoken()){
      //this.alert.type = this.currentGroup
      if(this.alertTranslations.length > 0){
        var cont = 0
        this.alertTranslations.forEach(element => {
          if(element != undefined){
            this.alert.translatedName.push({code:this.langsShow[cont].code,title:this.alertTranslationsTitle[cont], translation: element})
          }
          cont++
        });
      }

      // Actualizar traducciones de los identificadores o nombres de las URL
      // Para cada idioma
      for(var i =0; i<this.alertTranslationsUrl.length;i++){
        // Para cada URL
        for(var j=0;j<this.alertTranslationsUrl[i].data.length;j++){
          if(this.alertTranslationsUrl[i].data[i]==""){
            for(var k =0;k<this.langs.length;k++){
              if(k==i){
                this.alert.url[j].name[i]=({code:this.langs[k].code,translation:""});
              }
            }
            //this.alert.url[j].name[i].traslation="";
          }
          else{
            for(var k =0;k<this.langs.length;k++){
              if(k==i){
                this.alert.url[j].name[i]=({code:this.langs[k].code,translation:this.alertTranslationsUrl[i].data[j]});
              }
            }
            //this.alert.url[j].name[i].translation=this.alertTranslationsUrl[i].data[j]
          }
        }
        if(this.alertTranslationsUrl[i].data.length==0){
          for(var k =0;k<this.langs.length;k++){
            if(k==i){
              this.alert.url[j].name[i]=({code:this.langs[k].code,translation:""});
            }
          }
         // this.alert.url[j].name[i].translation="";
        }
      }


      // Tratar la direccion URL
      /*for(var i =0;i<this.alertAddressUrl.length;i++){
        var alertAddresUrlCutted=[];
        // Lo primero, si incluye el http se lo quitamos
        if(this.alertAddressUrl[i].match(/^http:\/\//)){
          alertAddresUrlCutted=this.alertAddressUrl[i].split("http://");
          this.alertAddressUrl[i]=alertAddresUrlCutted[1];

        }
        // Si no lo incluía
        else{
          // Compruebo si lo que incluye es https
          if(this.alertAddressUrl[i].match(/^https:\/\//)){
            alertAddresUrlCutted=this.alertAddressUrl[i].split("https://");
            this.alertAddressUrl[i]=alertAddresUrlCutted[1];
          }
        }

        // Con esto, se añade https:// delante del string
        this.alertAddressUrl[i]="http://"+this.alertAddressUrl[i];

        // Comprobamos entonces si es externa o interna:
        var alertAddresUrlInt=[];
        if(this.alertAddressUrl[i].indexOf(environment.api)>-1){
          // Interna
          alertAddresUrlInt=this.alertAddressUrl[i].split(environment.api);
          this.alertAddressUrl[i]=alertAddresUrlInt[1];
        }
        // Si es externa no hacemos nada, se guarda tal cual

      }*/

      // Actualizar la URL de la alerta
      console.log(this.alertAddressUrl)
      for (var i =0; i<this.alertAddressUrl.length;i++){
        this.alert.url[i].url=this.alertAddressUrl[i];
      }
      this.subscription.add( this.http.post(environment.api+'/api/alerts/alertAndUserAlerts/allUser/'+this.currentGroupId, this.alert)
      .subscribe( (res : any) => {
        this.sending = false;
        this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
        this.back()
        this.emptyAlert()
        this.emptyForm()
       }, (err) => {
         console.log(err);
         this.sending = false;
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
         }
       }));
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getLangs(){
    this.subscription.add( this.http.get(environment.api+'/api/langs/')
    .subscribe( (res : any) => {

      this.langs = res;
      this.langs.forEach(element => {
        this.langsShow.push({code:element.code, value:false})
      });
      for(var i =0;i<this.langs.length;i++){
        this.alertTranslationsUrl[i]={data:[]};
      }

    }, (err) => {
      console.log(err);
    }));
  }


  getNotifications(){
    this.loadingNotifications = true;
    this.subscription.add( this.http.get(environment.api+'/api/admin/users/'+this.groupSelected._id)
    .subscribe( (res : any) => {

      this.users = res;
      this.usersCopy = JSON.parse(JSON.stringify(res));


      this.subscription.add( this.http.get(environment.api+'/api/alerts/' + this.groupSelected._id)
      .subscribe( (res : any) => {
        this.notifications = res;
        var cont = 0
        for (var i =0; i<res.length ;i++){
          for (var j=0; j<res[i].translatedName.length;j++){
            if(res[i].translatedName[j].code == this.authService.getLang()){
              // texto al lado del identifier en este idioma
              switch(res[i].type){
                case '6months':
                  this.translateName6Months[res[i].identifier]=(res[i].translatedName[j].title);
                  break;
                case '12months':
                  this.translateName12Months[res[i].identifier]=(res[i].translatedName[j].title);
                  break;
                case this.groupSelected.name:
                  this.translateNameGroup[i]=(res[i].translatedName[j].translation);
                  break;
              }
            }
          }
        }

        this.loadingNotifications = false;


      }, (err) => {
        console.log(err);
      }));
    }, (err) => {
      console.log(err);
      this.loadingNotifications = false;
    }));

  }

  addTranslations(){
    this.selectingLanguages=true;

  }


  deleteAlert(row){
    swal({
      title: this.translate.instant("generics.Are you sure?"),
      text: this.translate.instant("notifications.This alert will be deleted"),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0CC27E',
      cancelButtonColor: '#d71920',
      confirmButtonText: this.translate.instant("generics.Delete"),
      cancelButtonText: this.translate.instant("generics.No, cancel"),
      showLoaderOnConfirm: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        //this.confirmDeleteKnowledge();
        this.subscription.add( this.http.delete(environment.api+'/api/alerts/alertAndUserAlerts/'+row._id)
        .subscribe( (res : any) => {
          this.sending = false;
          this.getNotifications()

        }, (err) => {
          console.log(err);
          this.sending = false;
          if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
            this.authGuard.testtoken();
          }
        }));
      }

    }).catch(swal.noop);
  }

  languagesSelected(){

    this.langsShow.forEach(lang => {
        lang.value = false
    });

    this.langsShow.forEach(lang => {
      var cont=0;
      this.langsSelected.forEach(element => {
        if(lang.code == element.split(",")[0]){
          lang.value = true
        }
        cont++;
      });
    });
  }

  openEditNotification(alert){
    this.alertTranslationsUrl=[];
    this.createNotification = true;
    this.editNotification = true;
    this.alert = alert
    this.selectingLanguages = true

    this.langsShow.forEach(lang => {
      lang.value = false
    });
    if(this.alert!=undefined){
      if(this.alert.translatedName.length > 0){
        var cont = 0
        this.alert.translatedName.forEach(element => {
          this.langs.forEach(lang => {
            if(lang.code == element.code){
              this.langsSelected[cont] = lang.code + "," + lang.name
            }
            if(lang.code == this.langsShow[cont].code){
              this.langsShow[cont].value = true;
              this.alertTranslations[cont] = element.translation;
              this.alertTranslationsTitle[cont]=this.alert.translatedName[cont].title;
              var urlList=[];
              for(var i=0;i<this.alert.url.length;i++){
                urlList.push(this.alert.url[i].name[cont].translation)
              }
              this.alertTranslationsUrl[cont]={data:urlList};
            }
          });
          cont++
        });
      }
      this.alertAddressUrl=[];
      for (var ji=0; ji<this.alert.url.length;ji++){
        this.alertAddressUrl.push(this.alert.url[ji].url)
      }
    }
    //this.langsShow = []
  }

  openCreateNotification(){
    this.createNotification = true;
    this.editNotification = false;
  }

  closePanel(){
    this.notifications = JSON.parse(JSON.stringify(this.notificationsCopy));
    this.modalReference.close();
  }

  back(){
    this.createNotification = false;
    this.editNotification = false;
    this.getNotifications()
    this.emptyForm()
    this.emptyAlert()
  }

  resetForm() {
    this.emptyAlert()
    this.emptyForm()
    this.notifications= JSON.parse(JSON.stringify(this.notificationsCopy));
    this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
  }

  addUrl(){
    var addNewURL=false;
    for(var i =0;i<this.langsShow.length;i++){
      if(this.langsShow[i].value==true){
        addNewURL=true;
      }
    }
    if(addNewURL==true){
    if(this.alert.url==undefined){
      this.alert.url=[{name:[],url:""}];
      for(var i=0;i<this.langsSelected.length;i++){
        if(this.alertTranslationsUrl[i]==undefined){
          this.alertTranslationsUrl[i]={data:[]};
        }
      }
    }
    else{
      this.alert.url.push({name:[],url:""});
      for(var i=0;i<this.langsSelected.length;i++){
        if(this.alertTranslationsUrl[i]==undefined){
          this.alertTranslationsUrl[i]=({data:[]});
        }
        else{
          this.alertTranslationsUrl[i].data.push("");
        }
      }
    }

    }

  }
  deleteUrl(){
    this.alert.url.pop();
  }


}
