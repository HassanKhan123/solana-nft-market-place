"use client";

import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import * as anchor from "@coral-xyz/anchor";

import WalletConnection from "@/app/components/WalletConnect";
import idl from "@/lib/idl/marketplace_task_contract.json";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const NETWORK = "https://api.devnet.solana.com";
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";

const initializeMarketplace = async (
  program: Program,
  provider: AnchorProvider
) => {
  const name = "khan_marketplace";
  const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    program.programId
  )[0];
  const rewardsMint = anchor.web3.Keypair.generate().publicKey; // Replace with actual mint if needed
  const treasury = anchor.web3.Keypair.generate().publicKey; // Replace with actual treasury if needed

  try {
    const account = await program.account.marketplace.fetch(marketplace);
    console.log("Marketplace already initialized:", account);
  } catch (err) {
    console.log("Marketplace not initialized. Initializing...");

    await program.methods
      .initialize(name, 1) // name and fee percentage
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
export default function NftMarketPlace() {
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [nftMetadata, setNftMetadata] = useState<Record<string, any>>({});

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

  const fetchMetadata = async (mintAddresses: string[]) => {
    if (!mintAddresses.length) return [];
    try {
      const { data } = await axios.post(
        `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`,
        { mintAccounts: mintAddresses }
      );
      return data;
    } catch (err) {
      console.error("Failed to fetch metadata", err);
      return [];
    }
  };

  const loadListings = async () => {
    if (!program) return;
    try {
      const allListings = await program.account.listing.all();
      console.log("Loaded listings:", allListings.length);
      setListings(allListings);

      const mints = allListings.map((l: any) => l.account.mint.toBase58());
      const metadata = await fetchMetadata(mints);

      const metaByMint: Record<string, any> = {};
      metadata.forEach((nft: any) => {
        metaByMint[nft.mint] = nft;
      });
      setNftMetadata(metaByMint);
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
    if (!program || !wallet.publicKey) return;
    try {
      await program.methods
        .purchase()
        .accounts({
          buyer: wallet.publicKey,
          listing: listing.publicKey,
          // Add any other required accounts here
        })
        .rpc();
      alert("Purchase successful!");
      loadListings();
    } catch (err) {
      console.error("Purchase failed", err);
      alert("Purchase failed: " + err);
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
        {listings.map((listing, i) => {
          const mint = listing.account.mint.toBase58();
          const meta = nftMetadata[mint];
          return (
            <div
              key={i}
              className="bg-gray-800 p-4 rounded-xl shadow flex flex-col"
            >
              {meta?.offChainMetadata?.image && (
                <img
                  src={meta.offChainMetadata.image}
                  alt="NFT"
                  className="rounded-xl mb-4 object-cover h-48"
                />
              )}
              <h2 className="text-lg font-bold mb-1">
                {meta?.offChainMetadata?.name || "Unnamed NFT"}
              </h2>
              <p className="text-sm flex-grow">
                {meta?.offChainMetadata?.description || "No description"}
              </p>
              <p className="mt-3 font-semibold">
                Price: {listing.account.price.toString()} SOL
              </p>
              <button
                onClick={() => purchaseNFT(listing)}
                className="mt-4 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition"
              >
                Purchase
              </button>
            </div>
          );
        })}
      </main>
    </WalletConnection>
  );
}
