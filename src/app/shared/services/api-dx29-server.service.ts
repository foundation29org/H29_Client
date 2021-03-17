import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class ApiDx29ServerService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    getAzureBlobSasToken(containerName){
        return this.http.get(environment.api+'/api/getAzureBlobSasTokenWithContainer/'+containerName)
        .map( (res : any) => {
            return res.containerSAS;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

}
