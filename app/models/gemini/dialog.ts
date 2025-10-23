/**
 * @license
 *
 * Copyright 2023 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==============================================================================
 */

import {DialogParams} from '@core/shared/interfaces';
import {DialogModel} from '../dialog_model';
import { callDialogModel, ModelParams } from './api';
import {createModelResults} from '../utils';

import {ContextService, StatusService} from '@services/services';
import { logEvent } from '../../db';

interface ServiceProvider {
  contextService: ContextService;
  statusService: StatusService;
}
/**
 * A Model representing Gemini API for chat.
 */
export class GeminiDialogModel extends DialogModel {
  constructor(serviceProvider: ServiceProvider) {
    super(serviceProvider);
  }

  override async query(
    chatParams: DialogParams,
    modelParams: Partial<ModelParams> = {}
  ) {

    const start = Date.now();
    const singleResponse = await callDialogModel(chatParams, modelParams);
    const response_time = Date.now() - start;    

    const responseText = singleResponse.length
      ? [singleResponse]
      : [];

    const results = createModelResults(responseText);

    logEvent({
      key: 'CHAT',      
      value: {
        prompt_text: JSON.stringify(chatParams),
        model_result: singleResponse,
        output: results,
        model_response_time: response_time,
        response_time: Date.now() - start,
      },
    });

    return results;
  }
}
