import { reactive, toRefs } from 'vue';
import { SignClient } from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";

const web3Modal = new Web3Modal({
  projectId: '903e70f857ddba83589b5bc85e89d03c',
  standaloneChains: ['eip155:5']
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
          projectId: '903e70f857ddba83589b5bc85e89d03c'
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
            chains: ['eip155:5'],
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
        state.account = session.namespaces.eip155.accounts[0].slice(9);
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
        const tx = {
          from: state.account,
          to: '0xBDE1EAE59cE082505bB73fedBa56252b1b9C60Ce',
          data: '0x',
          gasPrice: '0x029104e28c',
          gasLimit: '0x5208',
          value: '0x00'
        };

        const result = await state.signClient.request({
          topic: state.session.topic,
          chainId: 'eip155:5',
          request: {
            method: 'eth_sendTransaction',
            params: [tx]
          }
        });
        state.txnUrl = result;
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