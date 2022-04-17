import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { Contract, providers, utils } from "ethers";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

const Home: NextPage = () => {
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [presaleStarted, setPresaleStarted] = useState<boolean>(false);
  const [presaleEnded, setPresaleEnded] = useState<boolean>(false);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const web3ModalRef = useRef<Web3Modal | null>(null);

  const getOwner: () => Promise<void> = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContrct = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const owner = await nftContrct.owner();
      const userAddress = (signer as providers.JsonRpcSigner).getAddress();

      if (owner === userAddress) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startPresale: () => Promise<void> = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.startPresale();
      await txn.wait();
      setPresaleStarted(true);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleEnded: () => Promise<void> = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSecond = Date.now() / 1000;
      // lt is lest than
      const hasPreasaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSecond)
      );
      setPresaleEnded(hasPreasaleEnded);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleStarted: () => Promise<boolean> = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const getProviderOrSigner: (
    needSigner?: boolean
  ) => Promise<providers.Web3Provider | providers.JsonRpcSigner> = async (
    needSigner = false
  ) => {
    const provider = await web3ModalRef.current?.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("please switch to Rinkeby network");
      throw new Error("please switch to Rinkeby network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const connectWallet: () => Promise<void> = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const onPageLoad: () => Promise<void> = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  });

  const renderBody: () => JSX.Element | undefined = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect wallet
        </button>
      );
    }
  };

  return (
    <>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>
      <div className={styles.main}>{renderBody()}</div>
    </>
  );
};

export default Home;
