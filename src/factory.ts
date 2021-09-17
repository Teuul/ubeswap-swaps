import { PairCreated } from "../generated/Factory/Factory";
import { Pair, Token } from "../generated/schema";
import { Pair as PairTemplate } from "../generated/templates";

export function handleNewPair(event: PairCreated): void {
    // IDS
    let token0_id = event.params.token0.toHexString();
	let token1_id = event.params.token1.toHexString();
	let pair_id = event.params.pair.toHexString();
    
    // GET/CREATE TOKEN 0
    let token0 = Token.load(token0_id);
    if (token0 == null) {
        token0 = new Token(token0_id);
        token0.save();
    }

    // GET/CREATE TOKEN 1
    let token1 = Token.load(token1_id);
    if (token1 == null) {
        token1 = new Token(token1_id);
        token1.save();
    }

    // CREATE PAIR
    let pair = Pair.load(pair_id);
	if (pair == null) {
		pair = new Pair(pair_id);
        pair.tokens = [token0_id, token1_id];
		PairTemplate.create(event.params.pair);
		pair.save();
	}
}