import { MARKETPLACE_NAME } from "@/constants";
import { Program, AnchorProvider } from "@coral-xyz/anchor";

import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const initializeMarketplace = async (
  program: Program,
  provider: AnchorProvider
) => {
  const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(MARKETPLACE_NAME)],
    program.programId
  )[0];
  const rewardsMint = anchor.web3.Keypair.generate().publicKey;
  const treasury = anchor.web3.Keypair.generate().publicKey;

  try {
    const account = await program.account.marketplace.fetch(marketplace);
    console.log("Marketplace already initialized:", account);
  } catch (err) {
    console.log("Marketplace not initialized. Initializing...");

    await program.methods
      .initialize(MARKETPLACE_NAME, 1)
      .accounts({
        admin: provider.wallet.publicKey,
        marketplace,
        rewardsMint,
        treasury,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Marketplace initialized successfully!");
  }
};
