import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

export interface Signers {
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  carol: SignerWithAddress;
  dave: SignerWithAddress;
  [key: string]: SignerWithAddress;
}
