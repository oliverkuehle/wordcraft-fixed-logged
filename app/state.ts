
let operationId: string | null;
let operationName: string | null;

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