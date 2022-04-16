import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { Contract, providers, utils } from "ethers";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

const Home: NextPage = () => {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const web3ModalRef = useRef<Web3Modal | null>(null);

  const getProviderOrSigner: (
    needSigner?: boolean
  ) => Promise<providers.Web3Provider | providers.JsonRpcSigner> = async (
    needSigner = false
  ) => {
    const provider = await web3ModalRef.current?.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("please swithc to Rinkeby network");
      throw new Error("please swithc to Rinkeby network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const connetWallet: () => Promise<void> = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connetWallet();
    }
  });

  return <div>kskajdhkjashd</div>;
};

export default Home;
