import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC } from "react";

interface NftCardProps {
  index: number;
  nft: any;
  onClick: (nft: any) => void;
  txLoading: boolean;
}

const NftCard: FC<NftCardProps> = ({ index, nft, onClick, txLoading }) => {
  return (
    <div key={index} className="border p-4 rounded-lg shadow-md">
      <img
        src={nft.metadata.content.links?.image}
        alt={nft.metadata.content.metadata.name}
        className="w-full h-auto"
      />

      <h2 className="text-lg font-semibold mt-2">
        {nft.metadata.content.metadata.name}
      </h2>
      <p>{nft.metadata.content.metadata.symbol}</p>
      <p>Price: {Number(nft.price) / LAMPORTS_PER_SOL} SOL</p>
      <button
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded"
        onClick={() => onClick(nft)}
        style={{
          cursor: txLoading ? "not-allowed" : "pointer",
          opacity: txLoading ? 0.6 : 1,
        }}
        disabled={txLoading}
      >
        Purchase
      </button>
    </div>
  );
};

export default NftCard;
