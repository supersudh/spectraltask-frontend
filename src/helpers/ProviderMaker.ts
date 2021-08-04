import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';

export class ProviderMaker {
  accountsChangedCallback;

  constructor(
    accountsChangedCallback: (accounts: any) => void
  ) {
    this.accountsChangedCallback = accountsChangedCallback;
  }

  async buildAndGetProvider() {
    try {
      const provider: any = await detectEthereumProvider()
      if (provider) {
        console.log('Ethereum successfully detected!');
        provider.on('accountsChanged', this.accountsChangedCallback);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        console.log(19, accounts);
        const web3 = new Web3(provider);
        return { provider, web3 };
      }
      throw new Error('Provider not found');
    } catch (error) {
      console.log('Error in ProviderMaker.buildProvider');
      throw error;
    }
  }
}