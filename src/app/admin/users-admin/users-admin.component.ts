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

}
