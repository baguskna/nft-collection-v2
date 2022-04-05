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
  const [loading, setLoading] = useState<boolean>(false);
  const web3ModalRef = useRef<Web3Modal | null>(null);

  const getOwner: () => Promise<void> = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const owner = await nftContract.owner();
      const userAddress = await (
        signer as providers.JsonRpcSigner
      ).getAddress();

      if (owner.toLowerCase() === userAddress.toLocaleLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.log(error);
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
      // Get an instance of the NFT contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // This will return BigNumber because presaleEnded is a uint256
      // This will return a timestamp in seconds
      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const isPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(isPresaleEnded);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleStarted: () => Promise<boolean> = async () => {
    try {
      const provider = await getProviderOrSigner();
      // Get an instance of the NFT contract
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

  const connectWallet: () => Promise<void> = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };

  const getProviderOrSigner: (
    needSigner?: boolean
  ) => Promise<providers.Web3Provider | providers.JsonRpcSigner> = async (
    needSigner = false
  ) => {
    // We need to gain access tp the provider or signer from metamask
    const provider = await web3ModalRef.current?.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If the user is not connected to Rinkeby, tell them to switch network to Rinkeby
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

  const onPageLoad: () => Promise<void> = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
  };

  const presaleMint: () => Promise<void> = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();
      window.alert("minted");
    } catch (error) {
      console.log(error);
    }
  };

  const publicMint: () => Promise<void> = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();
      window.alert("minted");
    } catch (error) {
      console.log(error, "public mint");
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
  }, []);

  const renderBody: () => JSX.Element | undefined = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.description}>Loading...</span>;
    }

    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <span className={styles.description}>
            Presale has started! If your address is whitelisted, you can mint a
            CryptoDev!
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      return (
        <div>
          <span className={styles.description}>
            Presale has ended. You can mint CryptoDev in public sale if any
            remain
          </span>
          <button className={styles.button} onClick={publicMint}>
            Public Mint
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>
      <div className={styles.main}>{renderBody()}</div>
    </div>
  );
};

export default Home;
