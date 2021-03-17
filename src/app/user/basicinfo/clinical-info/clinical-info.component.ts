import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { Tratamiento } from './clinical-info.interface';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-clinicalInfo',
    templateUrl: './clinical-info.component.html',
    styleUrls: ['./clinical-info.component.scss']
})


export class ClinicalInfoComponent implements OnInit, OnDestroy{
  //Variable Declaration
  @ViewChild('f') clinicalInfoForm: NgForm;
  patient: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastsManager, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard) { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.patient = {
      edad: '',
      sexo: '',
      peso: '',
      altura: '',
      episodioshipoglucemia: '',
      gradomovilidad: '',
      cantidadejercicio: null,
      enfermedades: [],
      estadoanimo: 'Normal',
      tratamientos: []
    };

     this.loadTranslations();
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

  resetForm() {
    this.toastr.warning('', this.translate.instant("generics.Restored data"), { showCloseButton: true });
  }


  addSibling() {
    let tratamiento: Tratamiento = {nombre: null, dosis: null, hora: null};
    this.patient.tratamientos.push(tratamiento);
  }

  deleteSibling(index){
    this.patient.tratamientos.splice(index, 1);
  }


  submitInvalidForm() {
    if (!this.clinicalInfoForm) { return; }
    const base = this.clinicalInfoForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {
  this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
  }

}
