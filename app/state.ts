
let operationId: string | null;
let operationName: string | null;
let selectedModel: string | null = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

export function setCurrentOperationId(id: string) {
  operationId = id;
  console.log('Set operation ID to:', id);
}

export function setCurrentOperationName(name: string) {
  operationName = name;
  console.log('Set operation name to:', name);
}

export function getCurrentOperationId() {
  return operationId;
}

export function getCurrentOperationName() {
  return operationName;
}

export function setSelectedModel(model: string) {
  selectedModel = model;
  console.log('Set selected model to:', model);
}

export function getSelectedModel() {
  return selectedModel;
}