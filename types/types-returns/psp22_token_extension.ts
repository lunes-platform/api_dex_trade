import type BN from 'bn.js';
import type {ReturnNumber} from '@727-ventures/typechain-types';

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export type AccountId = string | number[]

export enum Psp22Error {
	totalSupplyFailed = 'TotalSupplyFailed',
	balanceOfFailed = 'BalanceOfFailed',
	allowanceFailed = 'AllowanceFailed',
	transferFailed = 'TransferFailed',
	transferFromFailed = 'TransferFromFailed',
	approveFailed = 'ApproveFailed',
	increaseAllowanceFailed = 'IncreaseAllowanceFailed',
	decreaseAllowanceFailed = 'DecreaseAllowanceFailed',
	tokenNameFailed = 'TokenNameFailed',
	tokenSymbolFailed = 'TokenSymbolFailed',
	tokenDecimalsFailed = 'TokenDecimalsFailed',
	balanceNoAllocated = 'BalanceNoAllocated'
}

