import { Helius, HeliusCluster } from "helius-sdk";

const helius = new Helius(process.env.NEXT_PUBLIC_HELIUS_API_KEY, "devnet"); // Replace with your API key

export async function getNFTsForOwner(ownerAddress: string) {
  try {
    const allNFTs = await helius.rpc.getAssetsByOwner({
      ownerAddress: ownerAddress,
      page: 1,
      limit: 1000, // Or adjust the limit as needed
    });
    console.log(allNFTs); // Process the returned NFT data
    return allNFTs.items.filter((nft: any) => !nft.compression.compressed);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
  }
}
