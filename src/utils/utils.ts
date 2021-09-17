import { log, ethereum, BigInt } from '@graphprotocol/graph-ts';
import { Event, Field, ArrayField, Item, Transaction } from '../../generated/schema';

export function getTransaction(event: ethereum.Event): Transaction {
  let txHash = event.transaction.hash.toHexString();
  let transaction = Transaction.load(txHash);
  if (transaction == null) {
    transaction = new Transaction(txHash);
    transaction.blockNumber = event.block.number;
    transaction.from = event.transaction.from.toHexString();
    transaction.stakeholders = [];
    transaction.events = [];
    transaction.save();
  }
  return <Transaction>transaction;
}

export function handleEvent(event: ethereum.Event, eventName: string): Event {
  let tx = getTransaction(event);
  let event_array = tx.events;
  let event_id = event.transaction.hash.toHex() + "-" + BigInt.fromI32(tx.events.length).toString();
  let e = new Event(event_id);
  e.origin = event.address.toHex();
  e.transaction = tx.id;
  event_array.push(e.id);
  tx.events = event_array;
  e.transactionLogIndex = event.transactionLogIndex;
  e.type = eventName;
  e.stakeholders = [e.origin];
  e.blockNumber = event.block.number;
  createData(event,event_id,e);
  e.save();
  let events_stakeholders:string[] = <string[]>e.stakeholders;
  let tx_stakeholders:string[] = <string[]>tx.stakeholders;
  for (let k=0;k<events_stakeholders.length;k++) {
    if (tx_stakeholders.includes(events_stakeholders[k]) == false) {
      tx_stakeholders.push(events_stakeholders[k]);
    }
  }
  tx.stakeholders = tx_stakeholders;
  tx.save();
  return e;
}

export function updateStakeholders(tx: Transaction,e: Event): void {
  let event_stakeholders = (<Event>e).stakeholders;
  for (let j=0;j<event_stakeholders.length;j++) {
    tx.stakeholders = addNewStakeholder((<string[]>event_stakeholders)[j], <string[]>(tx.stakeholders));
  }
  tx.save();
}

export function addNewStakeholder(element: string, array: string[]): string[] {
  let aux = array;
  for (let i=0;i<array.length;i++) {
    if (array[i] === element) {
      return array;
    }
  }
  aux.push(element);
  return aux;
}

export function createData(event: ethereum.Event, event_id: String, event_entity: Event): void {
  for (let i=0;i<event.parameters.length;i++) {
    if (event.parameters[i].value.kind==0) {
      let aux = event_entity.stakeholders;
      aux.push(getValueString(event.parameters[i].value));
      event_entity.stakeholders = aux;
    }
    if (event.parameters[i].value.kind<7) {
      let field = new Field(event_id + "-" + i.toString());
      field.name = event.parameters[i].name;
      field.event = event_id.toString();
      field.type = getKindString(event.parameters[i].value);
      field.value = getValueString(event.parameters[i].value);
      field.save();
    } else if (event.parameters[i].value.kind==8) {
      let array = new ArrayField(event_id + '-' + i.toString());
      array.name = event.parameters[i].name;
      array.event = event_id.toString();
      let aux = event.parameters[i].value.toArray();
      for (let j=0;j<aux.length;j++) {
        let item = new Item(event_id + "-" + i.toString() + '-' + j.toString());
        item.type = getKindString(aux[j]);
        item.value = getValueString(aux[j]);
        item.array = array.id;
        item.save();
      } array.save();
    } else {
      log.error('__ERROR__: TUPLES NOT HANDLED',[]);
    }
  }
}

export function getKindString(value: ethereum.Value): string {
  switch(value.kind){
    case(0):
      return 'ADDRESS';
    case(1):
      return 'FIXED_BYTES';
    case(2):
      return 'BYTES';
    case(3):
      return 'INT';
    case(4):
      return 'UINT';
    case(5):
      return 'BOOL';
    case(6):
      return 'STRING';
    case(7):
      return 'FIXED_ARRAY';
    case(8):
      return 'ARRAY';
    case(9):
      return 'TUPLE'; // not tested
    default:
      return 'NONE';
  }
}

export function getValueString(value: ethereum.Value): string {
  switch(value.kind){
    case(0):
      return value.toAddress().toHex().toString();
    case(1):
      return value.toBytes().toString();
    case(2):
      return value.toBytes().toString();
    case(3):
      return value.toBigInt().toString();
    case(4):
      return value.toBigInt().toString();
    case(5):
      if(value.toBoolean()==true)
        return 'true';
      else
        return 'false';
    case(6):
      return value.toString();
    case(7):
      return value.toArray().toString(); // not used
    case(8):
      return value.toArray().toString(); // not used
    case(9):
      return value.toTuple().toString(); // not handled
    default:
      return 'NONE';
  }
}