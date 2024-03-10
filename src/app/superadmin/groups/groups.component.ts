import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { LangService } from 'app/shared/services/lang.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-groups',
    templateUrl: './groups.component.html',
    styleUrls: ['./groups.component.scss']
})

export class GroupComponent implements OnInit, OnDestroy{
  @ViewChild('f') newGroupForm: NgForm;
  public group: any;

  addedgroup: boolean = false;
  editinggroup: boolean = false;
  workinggroup: boolean = false;

  langs: any;
  subscriptionsTypes: any;
  groups: Array<any> = [];
  loading: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastsManager, private langService: LangService){
    this.loadSubscriptionsTypes();
    this.loadGroups();
    this.loadLanguages();

    this.router.routeReuseStrategy.shouldReuseRoute = function(){
        return false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.resetForm();
  }

  loadLanguages() {
      this.subscription.add( this.langService.getLangs()
      .subscribe( (res : any) => {
        this.langs=res;
      }));
  }

  resetForm(){
    this.group = {
      name: '',
      subscription: '',
      email: '',
      defaultLang: ''
    };
  }

  loadSubscriptionsTypes() {
    this.subscription.add( this.http.get(environment.api+'/assets/jsons/subscriptions-types.json')
      .subscribe( (res : any) => {
          this.subscriptionsTypes=res;
       }, (err) => {
         console.log(err);
       }));
  }

  loadGroups() {
    //cargar los grupos actuales
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/groups/')
    .subscribe( (res : any) => {
      this.groups = res;
      this.loading = false;
     }, (err) => {
       console.log(err);
       this.loading = false;
     }));
  }

  newGroup() {
    this.addedgroup = true;
    this.editinggroup = false;
    this.resetForm();
  }

  cancelNewGroup(){
    this.addedgroup = false;
    this.editinggroup = false;
    this.resetForm();
  }

  submitInvalidForm() {
    if (!this.newGroupForm) { return; }
    const base = this.newGroupForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  submitNewGroup(){
    if(this.authGuard.testtoken()){
      //cargar los datos del usuario
      //var paramssend = { name: this.group.name, subscription: this.group.subscription, email: this.group.email};
      this.workinggroup = true;

      if(!this.editinggroup){
        var paramssend = { name: this.group.name, subscription: this.group.subscription, email: this.group.email, defaultLang: this.group.defaultLang};
        //nuevo grupo
        this.subscription.add( this.http.post(environment.api+'/api/group/'+this.authService.getIdUser(), paramssend)
        .subscribe( (res : any) => {
          this.workinggroup = false;
          this.editinggroup = false;
          if(res.message=="Group created"){
            swal(this.translate.instant("groups.Group created"), '', "success");
          }else if(res.message=="Group exists"){
            swal(this.translate.instant("generics.Warning"), this.translate.instant("groups.Group already exists"), "error");
          }else if(res.message=="fail"){
            swal(this.translate.instant("generics.Warning"), this.translate.instant("registration.email already exists"), "error");
          }else if(res.message=="Fail sending email"){
            swal(this.translate.instant("generics.Warning"), this.translate.instant("registration.could not be sent to activate"), "error");
          }else if(res.message=="without permission"){
            swal(this.translate.instant("generics.Warning"), this.translate.instant("generics.notpermission"), "error");
          }
          this.loadGroups();
         }, (err) => {
           this.workinggroup = false;
           this.editinggroup = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else if(err.error.message=="It failed to create the folders"){
               swal(this.translate.instant("generics.Warning"), 'Ha creado el grupo y añadido el admin, pero it failed to create the folders. Not sent verification email', "error");
           }else{
             swal(this.translate.instant("generics.Warning"), err.error.message, "error");
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.loadGroups();
         }));
      }else{
        //grupo exixtente
        var paramssend2 = { name: this.group.name, subscription: this.group.subscription, email: this.group.email, _id: this.group._id, defaultLang: this.group.defaultLang};
        this.subscription.add( this.http.put(environment.api+'/api/group/'+this.authService.getIdUser(), paramssend2)
        .subscribe( (res : any) => {
          this.workinggroup = false;
          this.editinggroup = false;

          this.loadGroups();
         }, (err) => {
           this.workinggroup = false;
           this.editinggroup = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
           }
           this.loadGroups();
         }));
      }


     }
    this.addedgroup = false;
  }


  editGroup(index){
    var setInputOptions = {};
    var actualSuscription = this.groups[index].subscription;

    this.addedgroup = true;
    this.editinggroup = true;
    this.group = this.groups[index];

    /*
    for (const subscription in this.subscriptionsTypes) {
      var type = this.subscriptionsTypes[subscription].type;
      setInputOptions[type] = type;
    }
    swal({
      title: this.translate.instant("groups.Select group"),
      input: 'select',
      inputOptions: setInputOptions,
      inputValue: actualSuscription,
      inputPlaceholder: this.translate.instant("groups.Select group"),
      showCancelButton: true,
      confirmButtonColor: '#0CC27E',
      cancelButtonColor: '#d71920',
      confirmButtonText: 'cambiar subscrición!',
      cancelButtonText: this.translate.instant("generics.No, cancel")
    }).then((result) => {
      if (result.value) {
        this.changeSuscriptionGroup(this.groups[index].name, result.value);
      }
    }).catch(swal.noop);
    */

  }

  confirmDeleteGroup(index) {

    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("groups.Group to be deleted")+': '+ this.groups[index].name+' <br> '+this.translate.instant("groups.Subscription")+ ': '+this.groups[index].subscription,
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
        this.deleteGroup(index);
      }

    }).catch(swal.noop);

  }

  deleteGroup(index){
    if(this.authGuard.testtoken()){
      var paramssend = this.authService.getIdUser()+'-code-'+this.groups[index]._id;
      this.subscription.add( this.http.delete(environment.api+'/api/group/'+paramssend)
      .subscribe( (res : any) => {
        if(res.message=="The group has been eliminated"){
          this.groups.splice(index, 1);
          swal('', this.translate.instant("groups.The group has been eliminated"), "success");

        }else if(res.message=="The group does not exist"){
          swal('', 'The group does not exist', "error");
          //location.reload();
          this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
          this.router.navigate([this.router.url]));
        }else if(res.message=="The user does not exist"){
          swal('Group delete, but not the files.', 'The user does not exist', "error");
          //location.reload();
          this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
          this.router.navigate([this.router.url]));
        }

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
       }));
     }
  }

}
