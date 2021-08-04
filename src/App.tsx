import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import DeleteIcon from '@material-ui/icons/Delete';


import './App.scss';
import { ProviderMaker } from './helpers/ProviderMaker';
import LocalStorage from './helpers/LocalStorage';

interface iProps { }

interface iState {
  providerError: string;
  provider: any;
  web3: any;
  selectedAddress: string;
  selectedAddressBalance: string;
  masterWalletAddress: string;
  isLoggedin: boolean;
}

const REACT_APP_BACKEND_URL = 'http://localhost:8000/api';

class App extends Component<iProps, iState> {
  constructor(props: iProps) {
    super(props);
    this.state = {
      providerError: '',
      provider: undefined,
      web3: undefined,
      selectedAddress: '',
      selectedAddressBalance: '',
      masterWalletAddress: LocalStorage.getMasterAddress(),
      isLoggedin: LocalStorage.getJWT() !== '',
    }
  }

  async componentDidMount() {
    if (this.state.isLoggedin) {
      this.onConnectWallet();
    }
  }

  accountsChangedCallback = (accounts: any) => {
    console.log('accountsChangedCallback', accounts);
    const stateUpdateObj: any = { selectedAddress: this.state.provider.selectedAddress };
    if (accounts.length) {
      if (this.state.selectedAddress !== this.state.provider.selectedAddres) {
        stateUpdateObj.isLoggedin = false;
      }
      this.setState(stateUpdateObj);
    }
  };

  onConnectWallet = async () => {
    try {
      const providerMakerInstance = new ProviderMaker(
        this.accountsChangedCallback
      );
      const { provider, web3 } = await providerMakerInstance.buildAndGetProvider();
      const setStateObj: any = { provider, web3 };
      console.log(60, provider.selectedAddress);
      if (provider.selectedAddress) {
        setStateObj.selectedAddress = provider.selectedAddress;
        let balance = await web3.eth.getBalance(provider.selectedAddress);
        balance = web3.utils.fromWei(balance, 'ether');
        if (String(balance).length > 6) {
          balance = String(balance).slice(0, 6);
        }
        setStateObj.selectedAddressBalance = balance;
      }
      this.setState(setStateObj);
    } catch (error) {
      const { message } = error;
      this.setState({ providerError: message });
    }
  }

  setMasterWalletAddress = (masterWalletAddress: string) => {
    LocalStorage.setMasterAddress(masterWalletAddress);
    this.setState({ masterWalletAddress });
  };

  handleLogin = () => {
    const { selectedAddress } = this.state;
    // --snip--
    fetch(`${REACT_APP_BACKEND_URL}/users?publicAddress=${selectedAddress}`)
      .then(response => response.json())
      // If yes, retrieve it. If no, create it.
      .then(
        users => (users.length ? users[0] : this.handleSignup(selectedAddress))
      )
      // Popup MetaMask confirmation modal to sign message
      .then(this.handleSignMessage)
      // Send signature to back end on the /auth route
      .then(this.handleAuthenticate)
    // --snip--
  };

  handleSignup = publicAddress =>
    fetch(`${REACT_APP_BACKEND_URL}/users`, {
      body: JSON.stringify({ publicAddress }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    }).then(response => response.json());

  handleSignMessage = ({ publicAddress, nonce }) => {
    const { web3, selectedAddress } = this.state;
    return new Promise((resolve, reject) =>
      web3.eth.personal.sign(
        web3.utils.fromUtf8(`We ask you to sign this message to prove ownership of this account ${publicAddress} ${nonce}`),
        selectedAddress,
        (err, signature) => {
          if (err) return reject(err);
          return resolve({ publicAddress, signature });
        }
      )
    );
  };

  handleAuthenticate = ({ publicAddress, signature }) =>
    fetch(`${REACT_APP_BACKEND_URL}/auth`, {
      body: JSON.stringify({ publicAddress, signature }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    }).then(async response => {
      const toJson = await response.json();
      console.log(133, toJson);
      LocalStorage.login(toJson.accessToken);
      this.setState({ isLoggedin: true });
    });

  handleLogout = () => {
    LocalStorage.logout();
    this.setState({ isLoggedin: false });
  };

  render(): JSX.Element {
    const {
      provider,
      selectedAddress,
      masterWalletAddress,
      selectedAddressBalance,
      isLoggedin
    } = this.state;
    if (selectedAddress) {
      return (
        <div className="App">
          <div className="wallet-list-container">
            <List dense={false}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <AccountBalanceWalletIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={provider.selectedAddress}
                  secondary={`Balance: ${selectedAddressBalance} ETH`}
                />
                <ListItemSecondaryAction>
                  {
                    selectedAddress !== masterWalletAddress ? (
                      <Button variant="outlined" color="primary" onClick={() => this.setMasterWalletAddress(selectedAddress)}>
                        Set as Master
                      </Button>
                    ) : (
                      <Button variant="outlined" color="secondary" onClick={() => this.setMasterWalletAddress('')}>
                        Unset as Master
                      </Button>
                    )
                  }
                  {
                    isLoggedin ? (
                      <Button variant="outlined" color="primary" onClick={this.handleLogout}>
                        Logout
                      </Button>
                    ) : (
                      <Button variant="outlined" color="primary" onClick={this.handleLogin}>
                        Login
                      </Button>
                    )
                  }

                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </div>
        </div>
      );
    } else {
      return (
        <div className="App">
          <Button variant="contained" color="primary" onClick={this.onConnectWallet}>
            Connect Wallet
          </Button>
        </div>
      );
    }
  }
}

export default App;
