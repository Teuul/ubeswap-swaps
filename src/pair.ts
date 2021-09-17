import {
	Swap
} from '../generated/templates/Pair/Pair';
import { handleEvent } from "./utils/utils";

export function handleSwap (event: Swap): void {
    handleEvent(event,"Swap");
}