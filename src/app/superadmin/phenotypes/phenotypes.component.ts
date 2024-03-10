import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-phenotypes',
    templateUrl: './phenotypes.component.html',
    styleUrls: ['./phenotypes.component.scss']
})

export class PhenotypesComponent implements OnDestroy{

  phenotype: any = [];
  groups: Array<any> = [];
  groupSelected: any ={};
  addingsymptom: boolean = false;
  @ViewChild('f') newSymptomForm: NgForm;
  public symptom: any;
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastsManager){
    this.loadGroups();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadGroups() {
    //cargar los grupos actuales
    this.subscription.add( this.http.get(environment.api+'/api/groups/')
    .subscribe( (res : any) => {
      this.groups = res;
     }, (err) => {
       console.log(err);
     }));
  }

  onChangeGroup(value){
    this.addingsymptom = false;
    this.resetForm();
    this.phenotype = [];
    //load phenotype
    this.subscription.add( this.http.get(environment.api+'/api/group/phenotype/'+value.name)
    .subscribe( (res : any) => {
      this.phenotype = res.infoPhenotype.data;
     }, (err) => {
       console.log(err);
     }));

  }

  newSymptom() {
    this.resetForm();
    this.addingsymptom = true;
  }

  resetForm(){
    this.symptom = {
      id: '',
      name: ''
    };
  }

  cancelNewGroup(){
    this.addingsymptom=false;
    this.resetForm();
  }

  submitInvalidForm() {
    if (!this.newSymptomForm) { return; }
    const base = this.newSymptomForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  submitSymptom(){
    this.phenotype.push({id:this.symptom.id,name:this.symptom.name});
    this.addingsymptom=false;
    this.savePhenotype();
  }

  confirmDeletePhenotype(index){
    swal({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ this.phenotype[index].name+' <br> ('+this.phenotype[index].id+')',
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
        this.phenotype.splice(index, 1);
        this.savePhenotype();
      }
    }).catch(swal.noop);
  }


  savePhenotype() {
    if(this.authGuard.testtoken()){
      //var paramssend = { lang: this.lang2, jsonData: this.datadest, group: this.authService.getGroup() };
      //cargar los datos del usuario
      var paramssend = { _id: this.groupSelected._id, phenotype: this.phenotype};
      this.subscription.add( this.http.put(environment.api+'/api/group/phenotype/'+this.authService.getIdUser(), paramssend)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"), { showCloseButton: true });
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
