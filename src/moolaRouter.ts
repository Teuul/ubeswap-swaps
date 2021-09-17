import { 
	TokensSwapped,
} from '../generated/UbeswapMoolaRouter/UbeswapMoolaRouter';
import { handleEvent } from "./utils/utils";

export function handleTokensSwapped (event: TokensSwapped): void {
    handleEvent(event,"Swap(MoolaRouter)");
}