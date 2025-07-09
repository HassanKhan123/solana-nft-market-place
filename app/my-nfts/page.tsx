"use client";

import { useEffect, useState } from "react";

import { useWallet } from "@solana/wallet-adapter-react";

import WalletConnection from "@/app/components/WalletConnect";

import { getNFTsForOwner } from "@/utils/nfts";

export default function NftMarketPlace() {
  const wallet = useWallet();

  const [nfts, setNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (wallet.publicKey && wallet.signTransaction) {
        const fetchedNFTs = await getNFTsForOwner(
          wallet.publicKey?.toBase58() || ""
        );
        setNFTs(fetchedNFTs);
        setLoading(false);
      }
    })();
  }, [wallet]);

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
              // onClick={() => handleListNFT(nft)}
            >
              List on Marketplace
            </button>
          </div>
        ))}
      </div>
    </WalletConnection>
  );
}
