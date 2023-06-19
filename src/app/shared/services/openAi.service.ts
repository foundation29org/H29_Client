import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { SortService } from 'app/shared/services/sort.service';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class OpenAiService {
    constructor(private http: HttpClient, private sortService: SortService) {}

    postOpenAi3(info){
      return this.http.post('https://af29.azurewebsites.net/api/duchenne', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
      
    }


}
