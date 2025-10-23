/**
 * A lightweight logging helper that posts to your server's /api/log route.
 * Safe to import from anywhere (browser or Node).
 */

import {ModelResults} from '@core/shared/types';

let participantId: string | null = localStorage.getItem('wordcraft-participantId');

export function setParticipantId(participantId: string) {
  participantId = participantId;
  localStorage.setItem('wordcraft-participantId', participantId);
}


export type LogEventTextModel = {
  key:
    | 'UNKNOWN_OPERATION'
    | 'SUGGEST_REWRITE'
    | 'REWRITE_SELECTION'
    | 'REWRITE_SENTENCE'
    | 'REWRITE_END_OF_SENTENCE'
    | 'REPLACE'
    | 'NEXT_SENTENCE'
    | 'NEW_STORY'
    | 'META_PROMPT'
    | 'GENERATE_WITHIN_SENTENCE'
    | 'FREEFORM'
    | 'FIRST_SENTENCE'
    | 'ELABORATE'
    | 'CONTINUE';
  value: {
    prompt_text: string;
    model_result: string;
    output: ModelResults;
    model_response_time: number;
    response_time: number;
  };
};

export type LogEventDialogModel =
  | {
      key: 'CHAT';
      value: {
        prompt_text: string;
        model_result: string;
        output: ModelResults;
        model_response_time: number;
        response_time: number;
      };
    }
  | {
      key: 'UNDO_LAST_TURN';
      value: {
        newMessages: string[];
        removedMessage: string;
      };
    };

export type LogEventTextModelKey = LogEventTextModel['key'];

/**
 * Sends a log event to /api/log.
 * Automatically stringifies JSON and handles basic errors.
 */
export async function logEvent(
  event: LogEventTextModel | LogEventDialogModel
): Promise<void> {
  const body = JSON.stringify({    
    event_key: event.key,
    event_value: {...event.value, user_id: participantId},
  });

  console.log(JSON.parse(body));
  return;

  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: body,
    });

    if (!response.ok) {
      console.error(
        '❌ Failed to log event:',
        response.status,
        await response.text()
      );
    }
  } catch (err) {
    console.error('❌ Error sending log event:', err);
  }
}

