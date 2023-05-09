html
<template>
  <div class="App">
    <h1>Wallet Connect V2</h1>
    <template v-if="account.length">
      <p>{{ account }}</p>
      <p>{{ message }}</p>
      <button class="button-style" @click="handleDisconnect">Disconnect</button>
    </template>
    <template v-else>
      <button class="button-style" @click="handleConnect">Connect</button>
    </template>
  </div>
</template>
 <script>
import { useWalletConnect } from "./hook/useWalletConnect";
 export default {
  setup() {
    const {
      account,
      txnUrl,
      message,
      handleConnect,
      handleDisconnect,
    } = useWalletConnect();
     return {
      account,
      txnUrl,
      message,
      handleConnect,
      handleDisconnect,
    };
  },
};
</script>
 <style scoped>
.App {
  text-align: center;
  font-family: "Arial", sans-serif;
  padding-top: 100px;
}

.button-style {
  padding: 8px 20px;
  background-color: aqua;
  border-radius: 4px;
  border: none;
  font-size: 20px;
  margin-top: 20px;
}
</style>