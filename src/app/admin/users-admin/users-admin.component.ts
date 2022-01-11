import { Component, ViewChild, OnDestroy } from '@angular/core';
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
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';
import { SortService} from 'app/shared/services/sort.service';


@Component({
    selector: 'app-users-admin',
    templateUrl: './users-admin.component.html',
    styleUrls: ['./users-admin.component.scss']
})

export class UsersAdminComponent implements OnDestroy{
  @ViewChild('f') newLangForm: NgForm;

  addedlang: boolean = false;
  lang: any;
  allLangs: any;
  langs: any;
  working: boolean = false;
  sending: boolean = false;
  loadingUsers: boolean = false;
  users: any = [];
  usersCopy: any = [];
  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  timeformat="";
  nameduchenneInter: string = globalvars.duchenneinternational;
  currentGroup: any;
  subgroups: any = [];
  countries: any;

  title = 'Select/ Unselect All';
  masterSelected:boolean = false;
  checkedList:any;

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastsManager, private modalService: NgbModal, private dateService: DateService,private adapter: DateAdapter<any>, private sortService: SortService){

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
    this.currentGroup = this.authService.getGroup()
    if(this.currentGroup==this.nameduchenneInter){
      this.loadSubgroups();
      this.loadCountries();
    }else{
      this.getUsers();
    }
  }

  loadSubgroups(){
    this.subscription.add( this.http.get('assets/jsons/subgroups.json')
    .subscribe( (res : any) => {
      this.subgroups = res;
      for (let i = 0; i < this.subgroups.length; i++) {
        this.subgroups[i].isSelected = false;
      }
      this.getCheckedItemList();
    }));
  }

  loadCountries(){
    this.subscription.add( this.http.get('assets/jsons/countries.json')
    .subscribe( (res : any) => {
      this.countries=res;
      this.getUsers();
    }, (err) => {
      console.log(err);
      this.getUsers();
    }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getUsers(){
    this.loadingUsers = true;
    this.subscription.add( this.http.get(environment.api+'/api/admin/users/'+this.authService.getGroup())
    .subscribe( (res : any) => {
      this.loadingUsers = false;
      if(this.currentGroup==this.nameduchenneInter){
        for(var j=0;j<res.length;j++){
          res[j].subgroup2= this.getNameSubgroup(res[j].subgroup)
          res[j].country= this.getNameCountry(res[j].country)
          res[j].userName = this.capitalizeFirstLetter(res[j].userName);
        }
      }else{
        for(var j=0;j<res.length;j++){
          res[j].userName = this.capitalizeFirstLetter(res[j].userName);
        }
      }

      res.sort(this.sortService.GetSortOrder("userName"));
      this.users = res;
      this.usersCopy = JSON.parse(JSON.stringify(res));
    }, (err) => {
      console.log(err);
      this.loadingUsers = false;
    }));
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

  getNameCountry(value){
    var res = '';
    var enc=false;
    for(var i =0; i<this.countries.length;i++){
      if(this.countries[i].code==value){
        res= this.countries[i].name;
        enc = true;
      }
    }
    return res;

  }

  changeDeathDate(user,content){
    this.user = user;
    this.user.death = this.dateService.transformDate(user.death);
    this.modalReference = this.modalService.open(content);
  }

  changeSubgroup(user,content){
    this.user = user;
    this.modalReference = this.modalService.open(content);
  }

  removeDate(){
    this.user.death = null;
  }

  closePanel(){
    this.users = JSON.parse(JSON.stringify(this.usersCopy));
    this.modalReference.close();
  }

  onSubmitUpdatePatient(){
    var data = {death: this.user.death};
    this.subscription.add( this.http.put(environment.api+'/api/admin/patients/'+this.user.patientId, data)
    .subscribe( (res : any) => {
      this.getUsers();
      this.modalReference.close();
     }, (err) => {
       console.log(err);
     }));
  }

  onSubmitUpdateUser(){
    var data = {subgroup: this.user.subgroup};
    this.subscription.add( this.http.put(environment.api+'/api/admin/users/subgroup/'+this.user.userId, data)
    .subscribe( (res : any) => {
      this.getUsers();
      this.modalReference.close();
     }, (err) => {
       console.log(err);
     }));
  }

  userChangedEvent(user, event){
    var data = {blockedaccount: event} ;
    this.subscription.add( this.http.put(environment.api+'/api/admin/users/state/'+user.userId, data)
    .subscribe( (res : any) => {
      this.usersCopy = JSON.parse(JSON.stringify(this.users));
     }, (err) => {
       console.log(err);
     }));
  }

  selectGroupToExport(content){
    this.checkedList = [];
    this.masterSelected = false;
    this.checkUncheckAll();
    this.modalReference = this.modalService.open(content);
  }

  // The master checkbox will check/ uncheck all items
  checkUncheckAll() {
    for (var i = 0; i < this.subgroups.length; i++) {
      this.subgroups[i].isSelected = this.masterSelected;
    }
    this.getCheckedItemList();
  }

  // Check All Checkbox Checked
  isAllSelected() {
    /*this.masterSelected = this.subgroups.every(function(item:any) {
      console.log(item)
        return (item.isSelected == true);
      })*/
    this.getCheckedItemList();
  }

  // Get List of Checked Items
  getCheckedItemList(){
    this.checkedList = [];
    var oneUnselected = false;
    for (var i = 0; i < this.subgroups.length; i++) {
      if(this.subgroups[i].isSelected){
        this.checkedList.push(this.subgroups[i]);
      }else{
        oneUnselected = true;
      }
    }
    //this.checkedList = JSON.stringify(this.checkedList);
  }

  onSubmitExportData(){
    this.sending = true;
    var dataSubgroups = [];
    var dataExported = {};
    for (var i = 0; i < this.checkedList.length; i++) {
      dataSubgroups.push(this.checkedList[i].id);
      dataExported[this.checkedList[i].id]={name: this.checkedList[i].name, country: this.checkedList[i].country};
    }
    this.subscription.add( this.http.post(environment.api+'/api/exportsubgroups', dataSubgroups)
    .subscribe( (res : any) => {
      var tempRes = JSON.parse(JSON.stringify(res));
      tempRes = this.addedMetadata(tempRes, dataExported);
      //load extraMetadata
      this.subscription.add( this.http.get(environment.api+'/api/sections/group/'+this.authService.getGroup())
        .subscribe( (res0 : any) => {
          this.sending = false;
          tempRes.metadata.dataPointsSections= {};
          res0.forEach((section)=>{
            if(section.enabled){
              tempRes.metadata.dataPointsSections[section._id] = section.name;
            }
          })

          this.createFile(tempRes);

        }, (err) => {
           console.log(err);
           this.sending = false;
           this.createFile(tempRes);
         }));
      
      
     }, (err) => {
      this.sending = false;
       console.log(err);
     }));
  }

  addedMetadata(res, dataExported){
      res.metadata.organizations = dataExported;
      res.metadata.responseType= {};
      res.metadata.responseType['CheckboxList'] = {label:'CheckboxList', desciption:'CheckboxList'};
      res.metadata.responseType['Choise'] = {label:'Choise', desciption:'Choise'};
      res.metadata.responseType['ChoiseSet'] = {label:'ChoiseSet', desciption:'ChoiseSet'};
      res.metadata.responseType['ChoiseAndDate'] = {label:'ChoiseAndDate', desciption:'ChoiseAndDate'};
      res.metadata.responseType['ChoiseAndRangeDate'] = {label:'ChoiseAndRangeDate', desciption:'ChoiseAndRangeDate'};
      res.metadata.responseType['Date'] = {label:'Date', desciption:'Date'};
      res.metadata.responseType['Label'] = {label:'Label', desciption:'Label'};
      res.metadata.responseType['Number'] = {label:'Number', desciption:'Number'};
      res.metadata.responseType['NumberChoiseAndDate'] = {label:'NumberChoiseAndDate', desciption:'NumberChoiseAndDate'};
      res.metadata.responseType['RadioButtons'] = {label:'RadioButtons', desciption:'RadioButtons'};
      res.metadata.responseType['Text'] = {label:'Text', desciption:'Text'};
      res.metadata.responseType['TextAndDoubleChoiseAndRangeDate'] = {label:'TextAndDoubleChoiseAndRangeDate', desciption:'TextAndDoubleChoiseAndRangeDate'};
      res.metadata.responseType['Title'] = {label:'Title', desciption:'Title'};
      res.metadata.responseType['Time'] = {label:'Time', desciption:'Time'};
      res.metadata.responseType['Toogle'] = {label:'Toogle', desciption:'Toogle'};
    return res;
  }

  createFile(res){
    var json = JSON.stringify(res);
      
    var blob = new Blob([json], {type: "application/json"});
    var url  = URL.createObjectURL(blob);
    var p = document.createElement('p');
    document.getElementById('content').appendChild(p);

    var a = document.createElement('a');
    var dateNow = new Date();
    var stringDateNow = this.dateService.transformDate(dateNow);
    a.download    = "dataRaito_"+stringDateNow+".json";
    a.href        = url;
    a.textContent = "dataRaito_"+stringDateNow+".json";
    a.setAttribute("id", "download")

    document.getElementById('content').appendChild(a);
    document.getElementById("download").click();
    this.modalReference.close();
  }

}
