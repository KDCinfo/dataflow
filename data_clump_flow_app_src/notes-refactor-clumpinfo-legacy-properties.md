# 'ClumpInfo' Model Refactor

```js
const a3a = clumpList1[0].hasOwnProperty('column') ? 'true' : 'false';
const a3a = clumpList1[0].column !== undefined ? 'true' : 'false';

clumpList1[0].hasOwnProperty('column') ? 'true' : 'false';
clumpList1[0].column !== undefined ? 'true' : 'false';

hasOwnProperty('column')
column !== undefined

```

```js
// Refactor of 'ClumpInfo' model to accommodate legacy properties.

export class AppConstants {
  static defaultClumpValues = {
    id: -1,
    clumpName: '',
    clumpCode: '',
    linkedToAbove: -1,
    linkedToLeft: -1,
    linkedTo: -1,
  };
}

export class ClumpInfo {
  constructor({
    id = AppConstants.defaultClumpValues.id,
    clumpName = AppConstants.defaultClumpValues.clumpName,
    clumpCode = AppConstants.defaultClumpValues.clumpCode,
    linkedToAbove = AppConstants.defaultClumpValues.linkedToAbove,
    linkedToLeft = AppConstants.defaultClumpValues.linkedToLeft,
    column,         // legacy property, remains undefined if not provided
    linkedTo,       // legacy property, remains undefined if not provided
    linkedClumpID   // legacy property, remains undefined if not provided
  } = {}) {
    this.id = id;
    this.clumpName = clumpName;
    this.clumpCode = clumpCode;
    this.linkedToAbove = linkedToAbove;
    this.linkedToLeft = linkedToLeft;

    // Legacy properties.
    this.column = column;
    this.linkedTo = linkedTo;
    this.linkedClumpID = linkedClumpID;
  }

  // Optionally, a factory method for clarity:
  static fromJSON(jsonData) {
    return new ClumpInfo(jsonData);
  }
}

// JSFiddle Test # 1
// const store1 = [{
//   "id": 2,
//   "clumpName": "Start Mac",
//   "clumpCode": "",
//   "linkedToAbove": 1,
//   "linkedToLeft": -1
// }];
const store1 = '[{"id": 2, "clumpName": "Start Mac", "clumpCode": "", "linkedToAbove": 1, "linkedToLeft": -1}]';

const clumpJsonArray1 = JSON.parse(store1);
const clumpList1 = clumpJsonArray1.map(clumpData => ClumpInfo.fromJSON(clumpData));

// const clumpWithColumnAndLinkedTo = new ClumpInfo();
// clumpWithColumnAndLinkedTo.column = 1;
// clumpWithColumnAndLinkedTo.linkedTo = 2;
// const clumpList1 = [clumpWithColumnAndLinkedTo];

// const a1a = clumpList1[0].hasOwnProperty('column') ? 'true' : 'false';
// const a1b = clumpList1[0].hasOwnProperty('linkedTo') ? 'true' : 'false';
// const a2a = ('column' in clumpList1[0]) ? 'true' : 'false';
// const a2b = ('linkedTo' in clumpList1[0]) ? 'true' : 'false';
const a3a = clumpList1[0].column !== undefined ? 'true' : 'false';
const a3b = clumpList1[0].linkedTo !== undefined ? 'true' : 'false';

// console.log('a1a', a1a); // true
// console.log('a1b', a1b); // true
// console.log('a2a', a2a); // true
// console.log('a2b', a2b); // true
console.log('a3a', a3a); // false
console.log('a3b', a3b); // false

// JSFiddle Test # 2
const store2 = '[{"id": 3, "clumpName": "Start Mac", "clumpCode": "", "column": 1, "linkedTo": -1}]';

const clumpJsonArray2 = JSON.parse(store2);
const clumpList2 = clumpJsonArray2.map(clumpData => ClumpInfo.fromJSON(clumpData));

const b3a = clumpList2[0].column !== undefined ? 'true' : 'false';
const b3b = clumpList2[0].linkedTo !== undefined ? 'true' : 'false';

console.log('b3a', b3a); // true
console.log('b3b', b3b); // true

// JSFiddle Test # 3
const store3 = '[{"id": 4, "clumpName": "Start Mac", "clumpCode": "", "column": -1, "linkedClumpID": 3}]';

const clumpJsonArray3 = JSON.parse(store3);
const clumpList3 = clumpJsonArray3.map(clumpData => ClumpInfo.fromJSON(clumpData));

const c3a = clumpList3[0].column !== undefined ? 'true' : 'false';
const c3b = clumpList3[0].linkedClumpID !== undefined ? 'true' : 'false';

console.log('b3a', c3a); // true
console.log('b3b', c3b); // true

```
