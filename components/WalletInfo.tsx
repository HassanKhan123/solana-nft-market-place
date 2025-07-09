"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const WalletInfo = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      }
    };

    fetchBalance();
  }, [publicKey, connection]);

  if (!publicKey) return null;

  return (
    <div className="text-sm text-gray-200 text-right">
      <div>
        <strong>Balance: </strong> {balance?.toFixed(3)} SOL
      </div>
      <div></div>
    </div>
  );
};
