import { Component, ViewChild, OnDestroy } from '@angular/core';
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
    selector: 'app-langs',
    templateUrl: './langs.component.html',
    styleUrls: ['./langs.component.scss'],
    providers: [LangService]
})

export class LangsComponent implements OnDestroy{
  @ViewChild('f') newLangForm: NgForm;

  addedlang: boolean = false;
  workinglangs: boolean = false;
  lang: any;
  allLangs: any;
  langs: any;
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, private langService: LangService, public toastr: ToastsManager){
    this.loadLanguages();
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

  loadAllLanguages() {
      this.subscription.add( this.langService.getAllLangs()
      .subscribe( (res : any) => {
        this.allLangs=res;
      }));
  }

  newLanguage() {
    this.loadAllLanguages();
    this.addedlang=true;
    this.lang = null;
  }

  confirmDeleteLang(index) {

    swal({
        title: this.translate.instant("generics.Are you sure?"),
        text:  this.translate.instant("lang.Language to be deleted")+': '+ this.langs[index].name+' ('+this.langs[index].code+')',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.deleteLang(index);
      }

    }).catch(swal.noop);

  }

  deleteLang(index){
    if(this.authGuard.testtoken()){
      //cargar los datos del usuario
      var paramssend = this.authService.getIdUser()+'-code-'+this.langs[index].code;
      this.subscription.add( this.http.delete(environment.api+'/api/superadmin/lang/'+paramssend)
      .subscribe( (res : any) => {
        if(res.message=="deleted" || res.message=="error, not found"){
          this.langs.splice(index, 1);
          swal('', this.translate.instant("lang.Language deleted"), "success");

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

  cancelNewLang(){
    this.addedlang=false;
    this.allLangs = [];
  }

  submitInvalidForm() {
    if (!this.newLangForm) { return; }
    const base = this.newLangForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  submitNewLang(){
    if(this.authGuard.testtoken() && this.lang){
      //cargar los datos del usuario
      var paramssend = { code: this.lang.code, name: this.lang.nativeName};
      this.workinglangs = true;
      this.subscription.add( this.http.put(environment.api+'/api/superadmin/lang/'+this.authService.getIdUser(), paramssend)
      .subscribe( (res : any) => {
        this.workinglangs = false;

        if(res.message=="added"){
          if(res.isSupported==false){
            swal(this.lang.nativeName+ ' is not Supported', this.translate.instant("lang.Remember translate the elements for the new language"), "success");
          }else{
            swal(this.translate.instant("generics.Data saved successfully"), this.translate.instant("lang.Remember translate the elements for the new language"), "success");
          }

          this.loadLanguages();

        }else if("already exists"){
          swal(this.translate.instant("generics.Warning"), this.translate.instant("lang.The language already exists"), "error");
        }

       }, (err) => {
         this.workinglangs = false;
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"), { showCloseButton: true });
         }
       }));
     }
    this.addedlang=false;
  }

}
