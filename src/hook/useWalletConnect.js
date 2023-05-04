import { reactive, toRefs } from 'vue';
import { SignClient } from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import { ethers } from 'ethers';

const web3Modal = new Web3Modal({
  projectId: '05355f8d4131c1e545c64d265fba6863',
  standaloneChains: ['eip155:1']
});

export function useWalletConnect() {
    const state = reactive({
      signClient: null,
      session: [],
      account: [],
      txnUrl: null
    });

    async function createClient() {
      try {
        const signClient = await SignClient.init({
          projectId: '05355f8d4131c1e545c64d265fba6863'
        });
        state.signClient = signClient;
        await subscribeToEvents(signClient);
      } catch (e) {
        console.log(e);
      }
    }

    async function handleConnect() {
      if (!state.signClient) throw Error('Client is not set');
      try {
        const proposalNamespace = {
          eip155: {
            methods: ['eth_sendTransaction'],
            chains: ['eip155:1'],
            events: ['connect', 'disconnect']
          }
        };

        const { uri, approval } = await state.signClient.connect({
          requiredNamespaces: proposalNamespace
        });

        if (uri) {
          web3Modal.openModal({ uri });
          const sessionNamespace = await approval();
          onSessionConnected(sessionNamespace);
          web3Modal.closeModal();
        }
      } catch (e) {
        console.log(e);
      }
    }

    async function onSessionConnected(session) {
      try {
        state.session = session;
        state.account = session.namespaces.eip155.accounts[0];
      } catch (e) {
        console.log(e);
      }
    }

    async function handleDisconnect() {
      try {
        await state.signClient.disconnect({
          topic: state.session.topic,
          message: 'User disconnected',
          code: 6000
        });
        reset();
      } catch (e) {
        console.log(e);
      }
    }

    async function subscribeToEvents(client) {
      if (!client)
        throw Error(
          'Unable to subscribe to events. Client does not exist.'
        );
      try {
        client.on('session_delete', () => {
          console.log(
            'The user has disconnected the session from their wallet.'
          );
          reset();
        });
      } catch (e) {
        console.log(e);
      }
    }

    async function handleSend() {
      if (!state.account.length) throw Error('No account found');
      try {
        // Construct the message that needs to be signed
        const message = 'Hello World';
        const messageHash = ethers.keccak256(ethers.utils.toUtf8Bytes(message));
         // Construct the transaction object
        const tx = {
          from: state.account,
          to: '0xBDE1EAE59cE082505bB73fedBa56252b1b9C60Ce',
          data: messageHash,
          gasPrice: '0x029104e28c',
          gasLimit: '0x5208',
          value: '0x00'
        };
         // Request the signature from the wallet
        const result = await state.signClient.request({
          topic: state.session.topic,
          chainId: 'eip155:1',
          request: {
            method: 'eth_sign',
            params: [state.account, messageHash]
          }
        });
         // Set the signature in the transaction object and send the transaction
        tx.signature = result;
        const response = await state.signClient.request({
          topic: state.session.topic,
          chainId: 'eip155:1',
          request: {
            method: 'eth_sendTransaction',
            params: [tx]
          }
        });
         // Set the transaction URL in the state
        state.txnUrl = response;
      } catch (e) {
        console.log(e);
      }
}

    const reset = () => {
      state.account = [];
      state.session = [];
    };

    createClient();

    return {
      ...toRefs(state),
      handleConnect,
      handleSend,
      handleDisconnect
    };
};