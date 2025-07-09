import axios from "axios";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { HELIUS_API_KEY } from "@/constants";

interface ListNFTParams {
  program: anchor.Program;
  walletPublicKey: PublicKey;
  nftMint: PublicKey;
  collectionMint: PublicKey;
  marketplace: PublicKey;
  makerAta: PublicKey; // user's associated token account for the NFT
  vault: PublicKey;
  listing: PublicKey;
  price: number; // or BN
  nftMetadata: any;
  nftEdition: any;
}

export async function getNFTsForOwner(ownerAddress: string) {
  try {
    const url = `https:///devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    const body = {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: ownerAddress,
        page: 1,
        limit: 100,
        displayOptions: {
          showUnverifiedCollections: true,
          showCollectionMetadata: true,
        },
      },
    };

    const response = await axios.post(url, body);
    const assets = response.data.result.items;
    console.log(assets);

    return assets.filter((nft: any) => nft.grouping.length);
    // const allNFTs = await helius.rpc.getAssetsByOwner({
    //   ownerAddress: ownerAddress,
    //   page: 1,
    //   limit: 1000, // Or adjust the limit as needed
    // });
    // console.log(allNFTs); // Process the returned NFT data
    // return allNFTs.items.filter((nft: any) => !nft.compression.compressed);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
  }
}

export const listNFT = async ({
  program,
  walletPublicKey,
  nftMint,
  collectionMint,
  marketplace,
  makerAta,
  vault,
  listing,
  price,
  nftEdition,
  nftMetadata,
}: ListNFTParams) => {
  try {
    const tx = await program.methods
      .list(price)
      .accountsPartial({
        maker: walletPublicKey,
        marketplace,
        makerMint: nftMint,
        collectionMint,
        makerAta,
        metadata: nftMetadata,
        vault,
        masterEdition: nftEdition,
        listing,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ NFT listed successfully!");
    console.log("Transaction:", tx);
    return tx;
  } catch (err) {
    console.error("❌ Error listing NFT:", err);
    throw err;
  }
};

export const getNFT = async (mintAddress: string) => {
  const response = await fetch(
    `https:///devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAsset",
        params: {
          id: mintAddress,
        },
      }),
    }
  );

  const data = await response.json();
  return data.result || null;
};
