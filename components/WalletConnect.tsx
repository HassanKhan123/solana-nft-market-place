"use client";

import React, { FC, ReactNode } from "react";
import Link from "next/link";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletInfo } from "./WalletInfo";

const wallets = [new PhantomWalletAdapter()];

const WalletConnection: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={clusterApiUrl("devnet")}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <Link href="/">
              <h1 className="text-xl font-bold">🛒 NFT Marketplace</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/my-nfts">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded transition duration-200">
                  My NFTs
                </button>
              </Link>

              <WalletInfo />
              <WalletMultiButton />
            </div>
          </div>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnection;
