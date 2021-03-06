
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Http, Headers } from '@angular/http';
import { ResourceService } from './resource.service';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import { mergeMap, tap } from 'rxjs/operators';

@Injectable()
export class ContentService {

  content: any[] = [
    // {
    //   title: 'Tutorial: Bind an existing custom SSL certificate to Azure Web Apps',
    //   description: 'Azure Web Apps provides a highly scalable, self-patching web hosting service. This tutorial shows you how to bind a custom SSL certificate that you purchased from a trusted certificate authority to Azure Web Apps. When you\'re finished, you\'ll be able to access your web app at the HTTPS endpoint of your custom DNS domain.',
    //   link: 'https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-ssl'
    // },
    // {
    //   title: 'Buy and Configure an SSL Certificate for your Azure App Service',
    //   description: 'This tutorial shows you how to secure your web app by purchasing an SSL certificate for your Azure App Service, securely storing it in Azure Key Vault, and associating it with a custom domain.',
    //   link: 'https://docs.microsoft.com/en-us/azure/app-service/web-sites-purchase-ssl-web-site'
    // }
  ];

  private ocpApimKeyBehaviorSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private ocpApimKey: string = '';

  constructor(private _http: Http, private _resourceService: ResourceService, private _backendApi: BackendCtrlService) { 

    this._backendApi.get<string>(`api/appsettings/ContentSearch:Ocp-Apim-Subscription-Key`).subscribe((value: string) =>{
      this.ocpApimKeyBehaviorSubject.next(value);
      this.ocpApimKey = value;
    });
  }

  getContent(searchString?: string): Observable<any[]> {
    const searchResults = searchString ? this.content.filter(article => {
      return article.title.indexOf(searchString) != -1
        || article.description.indexOf(searchString) != -1;
    }) : this.content;

    return of(searchResults);
  }

  searchWeb(questionString: string, resultsCount: string = '3'): Observable<any> {

    const searchSuffix = this._resourceService.searchSuffix;
    const query = encodeURIComponent(`${questionString} AND ${searchSuffix}`);
    const url = `https://api.cognitive.microsoft.com/bing/v7.0/search?q='${query}'&count=${resultsCount}`;

    return this.ocpApimKeyBehaviorSubject.pipe(
      mergeMap((key:string)=>{
        return this._http.get(url, { headers: this.getWebSearchHeaders() }).pipe(map(response => response.json()));
      })
    );
  }
  

  private getWebSearchHeaders(): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Ocp-Apim-Subscription-Key', this.ocpApimKey);

    return headers;
  }

}

export interface SearchResults {
  queryContext: { originalQuery: string };

}
