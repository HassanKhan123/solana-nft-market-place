/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import WalletConnection from "@/components/WalletConnect";
import idl from "@/lib/idl/marketplace_task_contract.json";
import { getNFTsForOwner, listNFT } from "@/utils/nfts";
import { MARKETPLACE_NAME, NETWORK } from "@/constants";
import {
  findMasterEditionPda,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import toast from "react-hot-toast";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

export default function NftMarketPlace() {
  const wallet = useWallet();

  const [nfts, setNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallet.publicKey && wallet.signTransaction) {
        await fetchNFTs();
      }
    })();
  }, [wallet]);

  const fetchNFTs = async () => {
    const fetchedNFTs = await getNFTsForOwner(
      wallet.publicKey?.toBase58() || ""
    );
    setNFTs(fetchedNFTs);
    setLoading(false);
  };

  const handleListNFT = async (nft: any) => {
    const loadingToast = toast.loading("Listing NFT...");
    try {
      setTxLoading(true);
      const connection = new Connection(NETWORK);

      //@ts-expect-error
      const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
      });
      setProvider(provider);

      const program = new Program(idl, provider);
      const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("marketplace"), Buffer.from(MARKETPLACE_NAME)],
        program.programId
      )[0];

      const nftMintAddress = new anchor.web3.PublicKey(nft.id);

      const makerAta = await getAssociatedTokenAddress(
        nftMintAddress,
        wallet.publicKey!
      );

      const listing = anchor.web3.PublicKey.findProgramAddressSync(
        [
          marketplace.toBuffer(),
          new anchor.web3.PublicKey(nftMintAddress as PublicKey).toBuffer(),
        ],
        program.programId
      )[0];

      const vault = anchor.utils.token.associatedAddress({
        mint: new anchor.web3.PublicKey(nftMintAddress),
        owner: listing,
      });

      const price = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

      const umi = createUmi(connection);

      const nftMetadata = findMetadataPda(umi, {
        mint: nftMintAddress,
      });

      const nftEdition = findMasterEditionPda(umi, {
        mint: nftMintAddress,
      });

      await listNFT({
        program,
        walletPublicKey: wallet.publicKey!,
        nftMint: nftMintAddress,
        collectionMint: new anchor.web3.PublicKey(nft.grouping[0].group_value),
        marketplace,
        makerAta,
        vault,
        listing,
        price,
        nftEdition,
        nftMetadata,
      });
      await fetchNFTs();
      setTxLoading(false);
      toast.success("NFT listed successfully!", { id: loadingToast });
    } catch (error) {
      setTxLoading(false);
      toast.error("Failed to list NFT", { id: loadingToast, icon: "🚨" });
      console.log(error);
    }
  };

  if (loading) return <p>Loading NFTs...</p>;

  return (
    <WalletConnection>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
        {nfts.map((nft, idx) => (
          <div key={idx} className="border p-4 rounded-lg shadow-md">
            <img
              src={nft.content.links?.image}
              alt={nft.content.metadata.name}
              className="w-full h-auto"
            />
            <h2 className="text-lg font-semibold mt-2">
              {nft.content.metadata.name}
            </h2>
            <p>{nft.content.metadata.symbol}</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 mt-4 rounded"
              onClick={() => handleListNFT(nft)}
              style={{
                cursor: txLoading ? "not-allowed" : "pointer",
              }}
            >
              List on Marketplace
            </button>
          </div>
        ))}
      </div>
    </WalletConnection>
  );
}
