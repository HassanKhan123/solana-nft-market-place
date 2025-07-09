/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

//@ts-nocheck

"use client";

import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

import * as anchor from "@coral-xyz/anchor";

import WalletConnection from "@/components/WalletConnect";
import idl from "@/lib/idl/marketplace_task_contract.json";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MARKETPLACE_NAME, NETWORK } from "@/constants";

import { getNFT } from "@/utils/nfts";
import toast from "react-hot-toast";
import NftCard from "@/components/NftCard";
import { initializeMarketplace } from "@/utils/marketplace";

export default function NftMarketPlace() {
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallet.publicKey && wallet.signTransaction) {
        const connection = new Connection(NETWORK);
        const provider = new AnchorProvider(connection, wallet, {
          preflightCommitment: "processed",
        });
        setProvider(provider);

        const program = new Program(idl, provider);

        setProgram(program);
        await initializeMarketplace(program, provider);
      }
    })();
  }, [wallet]);

  const loadListings = async () => {
    if (!program) return;
    try {
      const allListings = await program.account.listing.all();
      console.log("Loaded listings:", allListings);

      const metadata = await Promise.all(
        allListings.map(async (listing) => {
          const metadata = await getNFT(listing.account.mint.toBase58());
          return {
            metadata,
            price: listing.account.price.toString(),
            maker: listing.account.maker.toBase58(),
          };
        })
      );

      console.log(metadata);

      setListings(metadata);
    } catch (err) {
      console.error("Failed to load listings", err);
    }
  };

  useEffect(() => {
    console.log(program, "Program initialized");
    if (program) {
      loadListings();
    }
  }, [program]);

  const purchaseNFT = async (listing: any) => {
    const loadingToast = toast.loading("Purchasing NFT...");
    try {
      if (!program) return;

      setTxLoading(true);
      const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("marketplace"), Buffer.from(MARKETPLACE_NAME)],
        program.programId
      )[0];

      const nftMintAddress = new anchor.web3.PublicKey(listing.metadata.id);

      const takerAta = await getAssociatedTokenAddress(
        nftMintAddress,
        wallet.publicKey!
      );

      const ownerListing = anchor.web3.PublicKey.findProgramAddressSync(
        [marketplace.toBuffer(), nftMintAddress.toBuffer()],
        program.programId
      )[0];
      const vault = anchor.utils.token.associatedAddress({
        mint: nftMintAddress,
        owner: ownerListing,
      });

      const treasury = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), marketplace.toBuffer()],
        program.programId
      )[0];

      const tx = await program.methods
        .purchase()
        .accountsPartial({
          taker: wallet.publicKey!,
          maker: listing.maker,
          makerMint: listing.metadata.id,
          marketplace,
          takerAta,
          vault,
          ownerListing,
          treasury,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      console.log("\nPurchase Initialized!");
      console.log("Your transaction signature", tx);
      toast.success("NFT Purchased successfully!", { id: loadingToast });
      loadListings();
      setTxLoading(false);
    } catch (err) {
      setTxLoading(false);
      console.error("Purchase failed", err);
      toast.success("NFT Purchase Failed!", { id: loadingToast, icon: "🚨" });
    }
  };

  return (
    <WalletConnection>
      <main className="p-6 bg-gray-900 min-h-screen text-white grid grid-cols-1 md:grid-cols-3 gap-6">
        {listings.length === 0 && (
          <p className="col-span-full text-center mt-10 text-gray-400">
            No listings found.
          </p>
        )}
        {listings.map((nft, idx) => (
          <NftCard
            key={idx}
            index={idx}
            nft={nft}
            onClick={purchaseNFT}
            txLoading={txLoading}
          />
        ))}
      </main>
    </WalletConnection>
  );
}
