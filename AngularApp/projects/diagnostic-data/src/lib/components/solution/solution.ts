
import { SolutionTypeTag } from '../../models/solution-type-tag';
import { Dictionary } from 'projects/applens/src/app/shared/models/extensions';

export class Solution {
  Name: string;
  Title: string;
  Description: string;
  Action: ActionType;
  ApiOptions: ArmApiOptions;
  BladeOptions: GoToBladeOptions;
  TabOptions: OpenTabOptions;
  OverrideOptions: Dictionary<any>;
  RequiresConfirmation: boolean;
  ResourceUri: string;
  InternalInstructions: string;
  TypeTag: SolutionTypeTag;
  IsInternal: boolean;
  DetectorId: string;
}

export enum ActionType {
  ArmApi = 'ArmApi',
  OpenTab = 'OpenTab',
  GoToBlade = 'GoToBlade'
}

export class ArmApiOptions {
  Route: string;
  Verb: string;
}

export class OpenTabOptions {
  TabUrl: string;
}

export class GoToBladeOptions {
  DetailBlade: string;
  DetailBladeInputs: any;
  Extension?: string;
}