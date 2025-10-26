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

import {makePromptHandler as continuation} from './prompts/continue';
import {makePromptHandler as elaborate} from './prompts/elaborate';
import {makePromptHandler as firstSentence} from './prompts/first_sentence';
import {makePromptHandler as freeform} from './prompts/freeform';
import {makePromptHandler as generateWithinSentence} from './prompts/generate_within_sentence';
import {makePromptHandler as metaPrompt} from './prompts/meta_prompt';
import {makePromptHandler as nextSentence} from './prompts/next_sentence';
import {makePromptHandler as newStory} from './prompts/new_story';
import {makePromptHandler as replace} from './prompts/replace';
import {makePromptHandler as rewriteEndOfSentence} from './prompts/rewrite_end_of_sentence';
import {makePromptHandler as rewriteSelection} from './prompts/rewrite_selection';
import {makePromptHandler as rewriteSentence} from './prompts/rewrite_sentence';
import {makePromptHandler as suggestRewrite} from './prompts/suggest_rewrite';
import {ModelResults} from '@core/shared/types';
import {Model} from '../model';
import {callTextModel, ModelParams} from './api';
import {
  createModelResults,
  dedupeResults,
  getTextBetweenDelimiters,
  textContainsSpecialCharacters,
} from '../utils';

import {ContextService, StatusService} from '@services/services';
import {startsWithPunctuation} from '@lib/parse_sentences/utils';
import { logEvent, LogEventTextModelKey } from '../../db';

const D0 = '{';
const D1 = '}';
const BLANK = '____';

interface ServiceProvider {
  contextService: ContextService;
  statusService: StatusService;
}

/**
 * A Model representing Gemini API.
 */
export class GeminiModel extends Model {
  constructor(serviceProvider: ServiceProvider) {
    super(serviceProvider);
  }

  override getBlank() {
    return BLANK;
  }

  override getStoryPrefix() {
    return 'Story: ';
  }

  getPromptPreamble() {
    return 'I am an expert writing assistant, and can expertly write and edit stories.\n\n';
  }

  override wrap(text: string) {
    return `${D0}${text}${D1}`;
  }

  override insertBlank(pre: string, post: string) {
    return `${pre}${BLANK}${post}`;
  }

  addNewlines(...strings: string[]) {
    return strings.join('\n');
  }

  override parseResults(
    results: ModelResults,
    modelInputText = '',
    useDelimiters = true
  ): ModelResults {
    const parsed = results
      .map((result) => {
        if (modelInputText) {
          result.text = result.text.replace(modelInputText, '');
        }
        if (useDelimiters) {
          const text = getTextBetweenDelimiters(result.text, D0, D1) || '';
          return {...result, text};
        } else {
          // First, trim any excess spaces
          let trimmedText = result.text.trim();
          // Then, remove any leading punctuation
          if (startsWithPunctuation(trimmedText)) {
            trimmedText = trimmedText.slice(1);
          }

          return {...result, text: trimmedText};
        }
      })
      .filter((result) => {
        // We want to ensure that text is present, and make sure there
        // aren't any special delimiters present in the text (usually a
        // sign of a bug)
        const textExists = !!result.text;
        const noSpecialCharacters = !textContainsSpecialCharacters(result.text);
        return textExists && noSpecialCharacters;
      });

    return dedupeResults(parsed);
  }

  override async query(
    promptText: string,
    params: Partial<ModelParams> = {},
    shouldParse = true,
    operation: LogEventTextModelKey = 'UNKNOWN_OPERATION',
  ) {
    // candidateCount: setting is being rejected or ignored. workaround:
    promptText = promptText + "\nGenerate 8 responses. " +
      "Each response must start with: " + D0 + " and end with: " + D1;

    if (operation === 'UNKNOWN_OPERATION') {
      console.error('Unknown operation');
    }

    const start = Date.now();
    const res = await callTextModel(promptText, params);
    const response_time = Date.now() - start;    

    const responseText = getListOfReponses(res, D0, D1);

    const results = createModelResults(responseText);
    const output = shouldParse
      ? this.parseResults(results, promptText)
      : results;


    logEvent({
      key: operation,
      value: { 
        prompt_text: promptText,
        model_result: res,
        output: output,
        model_response_time: response_time,
        response_time: Date.now() - start,
      }
    });

    return output;
  }

  override continue = this.makePromptHandler(continuation);
  override elaborate = this.makePromptHandler(elaborate);
  override firstSentence = this.makePromptHandler(firstSentence);
  override freeform = this.makePromptHandler(freeform);
  override generateWithinSentence = this.makePromptHandler(
    generateWithinSentence
  );
  override metaPrompt = this.makePromptHandler(metaPrompt);
  override nextSentence = this.makePromptHandler(nextSentence);
  override newStory = this.makePromptHandler(newStory);
  override replace = this.makePromptHandler(replace);
  override rewriteEndOfSentence = this.makePromptHandler(rewriteEndOfSentence);
  override rewriteSelection = this.makePromptHandler(rewriteSelection);
  override rewriteSentence = this.makePromptHandler(rewriteSentence);
  override suggestRewrite = this.makePromptHandler(suggestRewrite);
}

/** Get text between two delimiters */
export function getListOfReponses(txt: string, d0: string, d1: string) {
  // Note: s flag indicates a "single line", which counts newlines as characters
  // allowing the regex to capture multi-line output
  const re = new RegExp(`(?<=${d0})(.*?)(?=${d1})`, 'gms');
  const matches = txt.match(re);
  const responseList = [];
  for (const match of matches) {
    // re-add the curly brackets
    responseList.push("{" + match + "}");
  }
  return responseList;
}
