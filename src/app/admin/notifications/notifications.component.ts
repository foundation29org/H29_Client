import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { SortService} from 'app/shared/services/sort.service';
import {DateAdapter} from '@angular/material/core';
import { Row } from 'ng2-smart-table/lib/data-set/row';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})

export class NotificationsComponent implements OnInit, OnDestroy{
  @ViewChild('f') newAlertForm: NgForm;

  addedlang: boolean = false;
  lang: any;
  langsSelected: any = []
  actualLang: string="en";
  langSelectedToEdit:string="en";
  translationsAdded: any;
  alertTranslations: string="";
  alertTranslationsTitle: string="";
  alertTranslationsUrl: any=[];
  alertTranslationsUpdate: string="";
  alertTranslationsTitleUpdate: string="";
  alertTranslationsUrlUpdate: any=[];
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
  currentGroup: any
  currentGroupId:any
  usersCopy: any = [];
  usersChecked: any = [];
  notifications: any = [];
  notificationsShow:any=[];
  notificationsCopy: any = [];
  user: any = {};
  modalReference: NgbModalRef;
  timeformat: any
  linebreaks:any
  createNotification: boolean = false;
  selectingLanguages: boolean = false;
  choiseUsers:any = null;
  nameduchenneInter: string = globalvars.duchenneinternational;
  subgroups: any = [];
  subgroup: string = null;

  private subscription: Subscription = new Subscription();

  public defaultColors:any = [
   {name:'red', code:'#ffffff'} ,
   {name:'1', code:'#000105'} ,
   {name:'r2ed', code:'#3e6158'} ,
   {name:'re3d', code:'#3f7a89'} ,
   {name:'red4', code:'#96c582'} ,
   {name:'red5', code:'#b7d5c4'} ,
   {name:'red6', code: '#bcd6e7'} ,
   {name:'red7', code: '#7c90c1'} ,
   {name:'red8', code:'#9d8594'} ,
   {name:'red9', code:'#dad0d8'} ,
   {name:'red0', code: '#4b4fce'} ,
   {name:'red11', code:'#4e0a77'} ,
   {name:'red12', code: '#a367b5'} ,
   {name:'red13', code:'#ee3e6d'} ,
   {name:'red14', code: '#d63d62'} ,
   {name:'redq', code: '#c6a670'} ,
   {name:'redw', code:'#f46600'} ,
   {name:'rede', code:'#cf0500'} ,
   {name:'redr', code: '#efabbd'} ,
   {name:'redt', code:'#8e0622'} ,
   {name:'redy', code:'#f0b89a'} ,
   {name:'redu', code: '#f0ca68'} ,
   {name:'redi', code: '#62382f'} ,
   {name:'redo', code:'#c97545'} ,
   {name:'redp', code:'#c1800b'}
  ];
  listOfUsers: string="";


  constructor(private http: HttpClient,
    public translate: TranslateService,
    private authService: AuthService,
    private authGuard: AuthGuard,
    public toastr: ToastsManager,
    private modalService: NgbModal,
    private dateService: DateService,
    private sortService: SortService,
    private blob: BlobStorageService,
    public searchFilterPipe: SearchFilterPipe,
    private adapter: DateAdapter<any>){
    this.getLangs()
    this.adapter.setLocale(this.authService.getLang());
    this.lang=this.authService.getLang();
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
    this.usersChecked=[];
    this.alert = {
      type: '',
      endDate: null,
      launchDate: null,
      url:[{name:[],url:""}],
      identifier: '',
      translatedName: []
    };
  }

  ngOnInit() {
    this.emptyAlert()
    this.getGroups()

    this.loadTranslations();
    this.getUsers();
    this.adapter.setLocale(this.authService.getLang());
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

  submitInvalidForm() {
    if (!this.newAlertForm) { return; }
    const base = this.newAlertForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  updateAlert(translation,row){
    this.alert=row;
    this.langSelectedToEdit=translation;
    this.editNotification=true;
  }

  onSubmitUpdate(){
    this.sending = true;
    //Update translations for the alert
    var urlDataUpdate=[];
    for(var i =0; i<this.alertTranslationsUrlUpdate.length;i++){
      urlDataUpdate.push({url:this.alert.url.split('<br>')[i],translation:this.alertTranslationsUrlUpdate[i]})
    }

    var paramsToUpdate={titleTranslation:this.alertTranslationsTitleUpdate,textTranslation:this.alertTranslationsUpdate,urlNameTranslation:urlDataUpdate,langCode:this.langSelectedToEdit}
    this.subscription.add(this.http.post(environment.api+'/api/alerts/updateTranslations/'+this.alert.id,paramsToUpdate )
    .subscribe( (res : any) => {
      this.sending = false;
      this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
      this.back()
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

  onSubmit() {
    if(this.authGuard.testtoken()){
      this.sending = true;
      this.alert.type = this.currentGroup

      // Tratar la direccion URL
      for(var i =0;i<this.alertAddressUrl.length;i++){
        // Comprobamos entonces si es externa o interna:
        var alertAddresUrlInt=[];
        if(this.alertAddressUrl[i].indexOf(environment.api)>-1){
          // Interna
          alertAddresUrlInt=this.alertAddressUrl[i].split(environment.api);
          this.alertAddressUrl[i]=alertAddresUrlInt[1];
        }
        // Si es externa no hacemos nada, se guarda tal cual

      }

      // Actualizar la URL de la alerta
      for (var i =0; i<this.alertAddressUrl.length;i++){
        this.alert.url[i].url=this.alertAddressUrl[i];
      }

      // Actualizar las traducciones del identificador o nombre de la URL de la alerta
      switch(this.actualLang){
        case 'en':
          // Actualizar Title y Text segun traducciones
          this.alert.translatedName[0]=({code:this.actualLang,title:this.alertTranslationsTitle, translation: this.alertTranslations})
          this.alert.translatedName[1]=({code:'es',title:"", translation: ""})
          this.alert.translatedName[2]=({code:'nl',title:"", translation: ""})

          // Actualizar URL Name segun traducciones
          for (var i=0;i<this.alertTranslationsUrl.length;i++){
              this.alert.url[i].name[0] = ({code:this.actualLang,translation:this.alertTranslationsUrl[i]});
              this.alert.url[i].name[1] = ({code:'es',translation:""});
              this.alert.url[i].name[2] = ({code:'nl',translation:""})
          }

          break;
        case 'es':
          // Actualizar Title y Text segun traducciones
          this.alert.translatedName[0]=({code:'en',title:"", translation: ""})
          this.alert.translatedName[1]=({code:this.actualLang,title:this.alertTranslationsTitle, translation: this.alertTranslations})
          this.alert.translatedName[2]=({code:'nl',title:"", translation: ""})

          // Actualizar URL Name segun traducciones
          for (var i=0;i<this.alertTranslationsUrl.length;i++){
            this.alert.url[i].name[0]=({code:'en',translation:""})
            this.alert.url[i].name[1]=({code:this.actualLang,translation:this.alertTranslationsUrl[i]})
            this.alert.url[i].name[2]=({code:'nl',translation:""})
          }
          break;
        case 'nl':
          // Actualizar Title y Text segun traducciones
          this.alert.translatedName[0]=({code:'en',title:"", translation: ""})
          this.alert.translatedName[1]=({code:'es',title:"", translation: ""})
          this.alert.translatedName[2]=({code:this.actualLang,title:this.alertTranslationsTitle, translation: this.alertTranslations})

          // Actualizar URL Name segun traducciones
          for (var i=0;i<this.alertTranslationsUrl.length;i++){
            this.alert.url[i].name[0]=({code:'en',translation:""})
            this.alert.url[i].name[1]=({code:'es',translation:""})
            this.alert.url[i].name[2]=({code:this.actualLang,translation:this.alertTranslationsUrl[i]})
          }
          break;
      }

      //find the value of type
      if(this.choiseUsers=='selected'){
        var notFail=false;
        var userInfo="";
        // Hacer la lista de usuarios para guardar en el receiver de la alerta
        for(var i=0;i<this.users.length;i++){
          for(var j=0;j<this.usersChecked.length;j++){
            if(this.users[i].userId==this.usersChecked[j]){
              userInfo= userInfo+([this.usersChecked[j],this.users[i].email,this.users[i].userName])+"-split-";
            }

          }
        }
        var paramsSend1=this.usersChecked;

        this.subscription.add(this.http.get(environment.api+'/api/admin/getPatientsForUserList/'+paramsSend1)
        .subscribe( (resPatientListIds : any) => {
          if(resPatientListIds){
            var data = {users:resPatientListIds.patientIdsList, alert: this.alert}
            this.subscription.add(this.http.post(environment.api+'/api/alerts/alertAndUserAlerts/selectedUser/'+this.currentGroupId, data)
              .subscribe( (res : any) => {
                this.sending = false;
                this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
                this.back()
              }, (err) => {
                console.log(err);
                this.sending = false;
                notFail=true;
                if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
                  this.authGuard.testtoken();
                }else{
                  this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
                }
              }));
          }

          }, (err) => {
            console.log(err);
            this.sending = false;
            notFail=true;
            if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
              this.authGuard.testtoken();
            }else{
              this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
            }
          }));

      }
      else if(this.choiseUsers=='all'){
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
      }else if(this.choiseUsers=='organization'){
        var date = Date.now();
        this.subscription.add(this.http.get(environment.api+'/api/admin/getPatientsForOrganization/'+this.subgroup+'&'+date)
        .subscribe( (resPatientListIds : any) => {
          if(resPatientListIds){
            var paramsSend="";
            paramsSend=this.currentGroupId+"-code-"+this.subgroup;
            var data = {users:resPatientListIds.patientIdsList, alert: this.alert}
            this.subscription.add(this.http.post(environment.api+'/api/alerts/alertAndUserAlerts/organization/'+paramsSend, data)
              .subscribe( (res : any) => {
                this.sending = false;
                this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
                this.back()
              }, (err) => {
                console.log(err);
                this.sending = false;
                notFail=true;
                if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
                  this.authGuard.testtoken();
                }else{
                  this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
                }
              }));
          }

          }, (err) => {
            console.log(err);
            this.sending = false;
            notFail=true;
            if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
              this.authGuard.testtoken();
            }else{
              this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
            }
          }));

      }



    }
  }

  selectType(selection){
    this.choiseUsers=selection;
  }

  isAnswerProvided(event,user){

    if(event.target.checked==true){
      this.usersChecked.push(user)
    }
    else if(event.target.checked==false){
      for(var i =0;i<this.usersChecked.length;i++){
        if(this.usersChecked[i]==user){
          this.usersChecked.splice(i, 1);
        }
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onChangeLang(newValue){
    this.actualLang=newValue;
    this.getNotifications(this.actualLang)
  }

  getLangs(){
    this.subscription.add( this.http.get(environment.api+'/api/langs/')
    .subscribe( (res : any) => {
      this.langs = res;
      this.langs.forEach(element => {
        this.langsShow.push({code:element.code, value:false})
      });

    }, (err) => {
      console.log(err);
    }));
  }

  getGroups(){
    this.subscription.add( this.http.get(environment.api+'/api/groups/')
    .subscribe( (res : any) => {
      this.groups = res;
      this.currentGroup = this.authService.getGroup()
      this.groups.forEach(element => {
        if(element.name == this.authService.getGroup()){
          this.currentGroupId = element._id
        }
      });
      this.getNotifications(this.actualLang);
      this.loadingNotifications = false
      if(this.currentGroup==this.nameduchenneInter){
        this.loadSubgroups();
      }
    }));
  }

  loadSubgroups(){
    this.subscription.add( this.http.get('assets/jsons/subgroups.json')
    .subscribe( (res : any) => {
      this.subgroups = res;
    }));
  }


  getNotifications(langCode){
    this.notificationsShow=[];
    this.notifications=[];
    this.loadingNotifications = true;
    var paramssend = this.currentGroupId+'-code-'+this.currentGroup+'-code-'+langCode;
    this.subscription.add( this.http.get(environment.api+'/api/alerts/typeGroupFilterLang/'+paramssend)
    .subscribe( (res : any) => {
      this.notifications = res;

      for(var j=0;j<this.notifications.length;j++){
        // Search URL
        var url="";
        if(this.notifications[j].url.length>0){
          for (var k =0;k<this.notifications[j].url.length;k++){
            url+=this.notifications[j].url[k].url+"<br>";
          }
        }

        // SEARCH LANG
        var indexLang = 0;
        switch(this.actualLang){
          case 'en':
            indexLang=0;
            break;
          case 'es':
            indexLang=1;
            break;
          case 'nl':
            indexLang=2;
            break;
        }

        var translationsForEachNotification=[]
        var translationsNotDoneForEachNotification=[]
        //Get translations of each notification
        for(var k=0;k<this.notifications[j].translatedName.length;k++){
          if(this.notifications[j].translatedName[k].title!=""){
            translationsForEachNotification.push(this.notifications[j].translatedName[k].code)
          }
          else{
            translationsNotDoneForEachNotification.push(this.notifications[j].translatedName[k].code)
          }
        }

        // ACCORDING TO TYPE COMPLETE THE LIST OF NOTIFICATIONS TO SHOW
        if(this.notifications[j].receiver.type=="broadcast"){
          this.notificationsShow.push({id:this.notifications[j]._id,receiver:{type:this.notifications[j].receiver.type,data:this.translate.instant("notifications.All users of the group")},title:this.notifications[j].translatedName[indexLang].title,translation:this.notifications[j].translatedName[indexLang].translation,url:url,launchDate:this.notifications[j].launchDate,translations:{done:translationsForEachNotification,notDone:translationsNotDoneForEachNotification}})
        }

        else if(this.notifications[j].receiver.type=="selectUsers"){
          var listOfUsers="";
          for(var k =0; k<this.notifications[j].receiver.data.length;k++){
            if((this.notifications[j].receiver.data[k].name!="")&&(this.notifications[j].receiver.data[k].email!="")){
              listOfUsers+="· "+this.notifications[j].receiver.data[k].name+"/ "+this.notifications[j].receiver.data[k].email+"<br>";;
            }
          }
          this.notificationsShow.push({id:this.notifications[j]._id,receiver:{type:this.notifications[j].receiver.type,data:this.translate.instant("notifications.Some users"),listOfUsers:listOfUsers},title:this.notifications[j].translatedName[indexLang].title,translation:this.notifications[j].translatedName[indexLang].translation,url:url,launchDate:this.notifications[j].launchDate,translations:{done:translationsForEachNotification,notDone:translationsNotDoneForEachNotification}})
        }else if(this.notifications[j].receiver.type=="organization"){
          var listOfUsers="";
          for(var k =0; k<this.notifications[j].receiver.data.length;k++){
            if((this.notifications[j].receiver.data[k].name!="")&&(this.notifications[j].receiver.data[k].email!="")){
              listOfUsers+="· "+this.notifications[j].receiver.data[k].name+"/ "+this.notifications[j].receiver.data[k].email+"<br>";;
            }
          }
          var nameSubgroup= this.getNameSubgroup(this.notifications[j].receiver.subgroup)
          this.notificationsShow.push({id:this.notifications[j]._id,receiver:{type:this.notifications[j].receiver.type, nameSubgroup:nameSubgroup, data:this.translate.instant("notifications.Some users"),listOfUsers:listOfUsers},title:this.notifications[j].translatedName[indexLang].title,translation:this.notifications[j].translatedName[indexLang].translation,url:url,launchDate:this.notifications[j].launchDate,translations:{done:translationsForEachNotification,notDone:translationsNotDoneForEachNotification}})
        }
      }
      this.loadingNotifications = false;
    }, (err) => {
      console.log(err);
    }));
  }

  getNameSubgroup(value){
    var res = '';
    var enc=false;
    for(var i =0; i<this.subgroups.length;i++){
      if(this.subgroups[i].id==value){
        res= this.subgroups[i].name;
        enc = true;
      }
    }
    return res;

  }

  openCreateNotification(){
    this.createNotification = true;
    this.editNotification = false;
  }

  openUserPanel(userPanel,dataReceived){
    this.listOfUsers="";
    this.listOfUsers=dataReceived.listOfUsers;
    let ngbModalOptions: NgbModalOptions = {
      backdrop : 'static',
      keyboard : false
    };
    this.modalReference = this.modalService.open(userPanel,  { windowClass: 'md-class'});

  }


  deleteAlert(row){
    swal({
      title: this.translate.instant("generics.Are you sure?"),
      text: this.translate.instant("notifications.This alert will be deleted")+": "+row.title,
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
        this.subscription.add( this.http.delete(environment.api+'/api/alerts/alertAndUserAlerts/'+row.id)
        .subscribe( (res : any) => {
          this.sending = false;
          this.getNotifications(this.actualLang)

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

  closePanel(){
    this.notifications = JSON.parse(JSON.stringify(this.notificationsCopy));
    this.modalReference.close();
  }

  back(){
    this.createNotification = false;
    this.editNotification = false;
    this.getNotifications(this.actualLang)
    this.emptyForm()
  }

  emptyForm(){
    this.selectingLanguages = false
    this.langsSelected = []
    this.alertTranslations = ""
    this.alertTranslationsTitle="";
    this.alertTranslationsUrl=[];
    this.langsShow.forEach(element => {
      element.value = false
    });
    this.emptyAlert();
    this.choiseUsers = null;
  }

  resetForm() {
    this.emptyAlert()
    this.emptyForm()
    this.notifications= JSON.parse(JSON.stringify(this.notificationsCopy));
    this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
  }

  addUrl(){
    if(this.alert.url==undefined){
      this.alert.url=[{name:[],url:""}];
    }
    else{
      this.alert.url.push({name:[],url:""});
    }
  }
  deleteUrl(){
    this.alert.url.pop();
  }

  getUsers(){
    this.users=[];
    this.usersChecked=[];
    this.subscription.add( this.http.get(environment.api+'/api/admin/subscribeUsers/'+this.authService.getGroup())
    .subscribe( (res : any) => {
      this.users = res;
      this.users.sort(function (a, b) {
        if (a.userName.toLowerCase() > b.userName.toLowerCase()) {
          return 1;
        }
        if (a.userName.toLowerCase() < b.userName.toLowerCase()) {
          return -1;
        }
        // a must be equal to b
        return 0;
      });
      this.usersCopy = JSON.parse(JSON.stringify(res));
    }, (err) => {
      console.log(err);
    }));
  }




}
