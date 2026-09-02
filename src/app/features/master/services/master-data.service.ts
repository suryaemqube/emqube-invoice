import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api';
import {
  InvoiceMessage,
} from '../../invoices/models/invoice.model';
import {
  MasterDataRow,
  MetaDataModel,
  RMetaDataList,
} from '../models/master-data.model';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private api = inject(ApiService);

  getList(metaDataId: string) {
    return this.api.post<MasterDataRow[] | null>(
      'Common',
      'GetMetaDataList',
      { MetaDataId: metaDataId },
    );
  }

  getForm(metaDataId: string, primaryKey: string) {
    return this.api.post<RMetaDataList>(
      'Common',
      'GetMetaData',
      { MetaDataId: metaDataId, PrimaryKey: primaryKey },
    );
  }

  addUpdate(metaDataId: string, data: MetaDataModel[]) {
    return this.api.post<InvoiceMessage>(
      'Common',
      'AddUpdateMetaData',
      { MetaDataId: metaDataId, Data: data },
    );
  }

  remove(metaDataId: string, primaryKey: string) {
    return this.api.post<InvoiceMessage>(
      'Common',
      'DeleteMetaData',
      { MetaDataId: metaDataId, PrimaryKey: primaryKey },
    );
  }
}