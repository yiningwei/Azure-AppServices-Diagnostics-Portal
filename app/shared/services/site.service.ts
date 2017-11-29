import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ArmService, AuthService, UriElementsService, ServerFarmDataService } from '../services';
import { Observable } from 'rxjs/Observable';
import { StartupInfo } from '../models/portal';
import { Site, SiteInfoMetaData } from '../models/site'
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class SiteService {

    public currentSite: BehaviorSubject<Site> = new BehaviorSubject<Site>(null);
    public currentSiteMetaData: BehaviorSubject<SiteInfoMetaData> = new BehaviorSubject<SiteInfoMetaData>(null);

    //TODO: This should be deprecated, but leaving it for now while we move to new solutions
    public currentSiteStatic: Site;

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService, private _serverFarmService: ServerFarmDataService) {
        this._authService.getStartupInfo().flatMap((startUpInfo: StartupInfo) => {
            this._populateSiteInfo(startUpInfo.resourceId);
            return this._armClient.getResource<Site>(startUpInfo.resourceId);
        }).subscribe((site: ResponseMessageEnvelope<Site>) => {
            this.currentSiteStatic = site.properties;
            this.currentSite.next(site.properties);
        });
    }

    // I am making the assumption that two sites on the same server farm must be in the same sub 
    // but they don't necessarily have to be in the same resource group
    private findTargetedSite(siteName: string): Observable<Site> {
        siteName = siteName.toLowerCase();
        return this.currentSite.flatMap(site => {
            if (site.name.toLowerCase() === siteName) {
                return Observable.of<Site>(site);
            }

            return this._serverFarmService.sitesInServerFarm.map(sitesInServerFarm => {
                return sitesInServerFarm.find(site => site.name.toLowerCase() === siteName)
            })
        })
    }

    parseResourceUri(resourceUri: string): any {

        var output = {
            subscriptionId: '',
            resourceGroup: '',
            siteName: '',
            slotName: ''
        };

        if (!resourceUri) {
            return output;
        }

        let resourceUriParts = resourceUri.toLowerCase().split("/");

        let subscriptionIndex = resourceUriParts.indexOf('subscriptions');
        if (subscriptionIndex > -1) {
            output.subscriptionId = resourceUriParts[subscriptionIndex + 1];
        }

        let resourceGroupIndex = resourceUriParts.indexOf('resourcegroups');
        if (resourceGroupIndex > -1) {
            output.resourceGroup = resourceUriParts[resourceGroupIndex + 1];
        }

        let sitesIndex = resourceUriParts.indexOf('sites');
        if (sitesIndex > -1) {
            output.siteName = resourceUriParts[sitesIndex + 1];
        }

        let slotIndex = resourceUriParts.indexOf('slots');
        if (slotIndex > -1) {
            output.slotName = resourceUriParts[slotIndex + 1];
        }

        return output;
    }

    restartSite(subscriptionId: string, resourceGroup: string, siteName: string): Observable<boolean> {
        return this.findTargetedSite(siteName).flatMap((targetedSite: Site) => {
            var slotName = '';
            var mainSiteName = targetedSite.name;

            if (targetedSite.name.indexOf('(') >= 0) {
                let parts = targetedSite.name.split('(');
                mainSiteName = parts[0];
                slotName = parts[1].replace(')', '');
            }

            let resourceUri: string = this._uriElementsService.getSiteRestartUrl(subscriptionId, targetedSite.resourceGroup, mainSiteName, slotName);
            return <Observable<boolean>>(this._armClient.postResource(resourceUri, null, null, true));
        });
    }

    killW3wpOnInstance(subscriptionId: string, resourceGroup: string, siteName: string, scmHostName: string, instanceId: string): Observable<boolean> {
        return this.findTargetedSite(siteName).flatMap((targetedSite: Site) => {
            if (targetedSite.enabledHostNames.length > 0) {
                let scmHostNameFromSiteObject = targetedSite.enabledHostNames.find(hostname => hostname.indexOf(".scm.") > 0);
                if (scmHostNameFromSiteObject !== null && scmHostNameFromSiteObject.length > 0) {
                    scmHostName = scmHostNameFromSiteObject;
                }
            }

            let url: string = this._uriElementsService.getKillSiteProcessUrl(subscriptionId, targetedSite.resourceGroup, targetedSite.name);
            let body: any = {
                "InstanceId": instanceId,
                "ScmHostName": scmHostName
            };

            let requestHeaders: Headers = this._getHeaders();

            return this._http.post(url, body, { headers: requestHeaders })
                .map((response: Response) => response.ok);
        })
    }

    getSiteAppSettings(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): Observable<any> {

        let url: string = this._uriElementsService.getListAppSettingsUrl(subscriptionId, resourceGroup, siteName, slot);

        return this._armClient.postResource(url, {});
    }

    updateSiteAppSettings(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '', body: any): Observable<any> {

        let url: string = this._uriElementsService.getUpdateAppSettingsUrl(subscriptionId, resourceGroup, siteName, slot);

        return this._armClient.putResource(url, body);
    }

    private _populateSiteInfo(resourceId: string): void {
        let pieces = resourceId.toLowerCase().split('/');
        this.currentSiteMetaData.next(<SiteInfoMetaData>{
            subscriptionId: pieces[pieces.indexOf('subscriptions') + 1],
            resourceGroupName: pieces[pieces.indexOf('resourcegroups') + 1],
            siteName: pieces[pieces.indexOf('sites') + 1],
            slot: pieces.indexOf('slots') >= 0 ? pieces[pieces.indexOf('slots') + 1] : ''
        });
    }

    private _getHeaders(): Headers {

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        return headers;
    }
}