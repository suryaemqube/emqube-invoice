import { ApiError } from '../../invoices/models/invoice.model';

export interface DropDownData {
  Id: number;
  Name: string;
}

export interface MetaDataModel {
  DisplayName: string;
  FieldValue: string | null;
  FieldName: string;
  DataType: string;
  Regex: string | null;
  UpdateField: boolean;
  IsForiegnkey: boolean;
  IsMandatory: boolean;
  DropDownList: DropDownData[] | null;
}

export interface RMetaDataList {
  Error: ApiError | null;
  MetaData: MetaDataModel[];
}

export interface MasterDataRow {
  [key: string]: unknown;
}