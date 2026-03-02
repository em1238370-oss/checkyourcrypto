// Crypto AI Assistant widget logic (frontend)
// Все запросы к AI и оплате выполняются через собственный бэкенд.

const API_BASE_URL = window.__API_BASE_URL__ || 'http://localhost:4000';

function getUserId() {
    const storageKey = 'crypto_academy_user_id';
    let userId = localStorage.getItem(storageKey);
    if (!userId) {
        userId = `user_${crypto.randomUUID()}`;
        localStorage.setItem(storageKey, userId);
    }
    return userId;
}

async function fetchStatus(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
            throw new Error('Status request failed');
        }
        return response.json();
    } catch (error) {
        console.error('Status check error:', error);
        return null;
    }
}

async function requestChatResponse(userId, question) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, question })
    });

    if (response.status === 402) {
        return { error: 'subscription_required' };
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Chat API error:', errorBody);
        return { error: 'chat_failed' };
    }

    return response.json();
}

function formatDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateSubscriptionSection(status) {
    if (!subscriptionSection || !timerDisplay || !chatExpiredOverlay || !chatMessages) {
        return;
    }
    
    // ⚠️ TEST MODE: Always show expired state for testing payment flow
    // TODO: Remove this after testing - uncomment the code below
    subscriptionSection.classList.add('hidden');
    chatExpiredOverlay.classList.remove('hidden');
    chatMessages.style.display = 'none';
    if (chatInputContainer) chatInputContainer.style.display = 'none';
    return;
    // END TEST MODE
    
    /* ORIGINAL CODE - Uncomment after testing:
    if (!status) {
        subscriptionSection.classList.add('hidden');
        return;
    }
    
    const now = new Date();
    const trialEnd = status.freeTrialEndsAt ? new Date(status.freeTrialEndsAt) : null;
    const subscriptionEnd = status.subscriptionActiveUntil ? new Date(status.subscriptionActiveUntil) : null;
    
    if (status.hasAccess) {
        if (subscriptionEnd && subscriptionEnd > now) {
            // User has active subscription - hide timer, show chat
            subscriptionSection.classList.add('hidden');
            chatExpiredOverlay.classList.add('hidden');
            chatMessages.style.display = 'flex';
            if (chatInputContainer) chatInputContainer.style.display = 'block';
        } else if (trialEnd && trialEnd > now) {
            // User is in free trial - show timer, show chat
            subscriptionSection.classList.remove('hidden');
            chatExpiredOverlay.classList.add('hidden');
            chatMessages.style.display = 'flex';
            if (chatInputContainer) chatInputContainer.style.display = 'block';
            startCountdown(trialEnd);
        } else {
            // Trial expired - hide timer and chat, show black overlay inside chat
            subscriptionSection.classList.add('hidden');
            chatExpiredOverlay.classList.remove('hidden');
            chatMessages.style.display = 'none';
            if (chatInputContainer) chatInputContainer.style.display = 'none';
        }
    } else {
        // No access - show black overlay inside chat
        subscriptionSection.classList.add('hidden');
        chatExpiredOverlay.classList.remove('hidden');
        chatMessages.style.display = 'none';
        if (chatInputContainer) chatInputContainer.style.display = 'none';
    }
    */
}

function startCountdown(endDate) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    if (!timerDisplay) {
        console.error('Timer display element not found!');
        return;
    }
    
    function updateTimer() {
        const now = new Date();
        const diff = endDate - now;
        
        if (diff <= 0) {
            if (timerDisplay) {
                timerDisplay.textContent = '00:00';
            }
            // Hide timer and messages, show black overlay inside chat
            if (subscriptionSection) {
                subscriptionSection.classList.add('hidden');
            }
            if (chatExpiredOverlay) {
                chatExpiredOverlay.classList.remove('hidden');
            }
            if (chatMessages) {
                chatMessages.style.display = 'none';
            }
            if (chatInputContainer) {
                chatInputContainer.style.display = 'none';
            }
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            return;
        }
        
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        if (timerDisplay) {
            timerDisplay.textContent = displayText;
        }
    }
    
    // Update immediately
    updateTimer();
    // Update every second to ensure smooth updates
    countdownInterval = setInterval(updateTimer, 1000);
}

function updateSubscriptionBanner(status) {
    currentSubscriptionStatus = status;
    if (!subscriptionBanner || !subscriptionTextEl) return;

    if (!status) {
        subscriptionBanner.classList.add('hidden');
        return;
    }

    const now = new Date();
    const trialEnd = status.freeTrialEndsAt ? new Date(status.freeTrialEndsAt) : null;
    const subscriptionEnd = status.subscriptionActiveUntil ? new Date(status.subscriptionActiveUntil) : null;

    let message;
    if (status.hasAccess) {
        if (subscriptionEnd && subscriptionEnd > now) {
            message = `Подписка активна до ${formatDateTime(subscriptionEnd)}.`;
        } else if (trialEnd && trialEnd > now) {
            message = `Бесплатный доступ действует до ${formatDateTime(trialEnd)}.`;
        } else {
            message = 'Бесплатный доступ активен. Используйте время с пользой!';
        }
    } else {
        if (trialEnd) {
            message = `Бесплатный период завершился ${formatDateTime(trialEnd)}. Чтобы продолжить пользоваться инструментами, оплатите подписку.`;
        } else {
            message = 'Бесплатный период завершён. Чтобы продолжить, оплатите подписку.';
        }
    }

    subscriptionTextEl.textContent = message;
    subscriptionBanner.classList.remove('hidden');

    if (payCryptoButton && !payCryptoButton.disabled) {
        payCryptoButton.textContent = 'Оплатить криптой';
    }
    
    // Also update the new subscription section
    updateSubscriptionSection(status);
}

function showPaymentModal(invoice) {
    if (!paymentModal || !paymentBackdrop) return;

    const amount = invoice?.amount ? Number(invoice.amount) : null;
    const currency = invoice?.currency || 'USDT';
    if (paymentAmountEl) {
        paymentAmountEl.textContent = amount ? `${amount} ${currency}` : `${currency}`;
    }
    if (paymentAddressText) {
        paymentAddressText.textContent = invoice?.address || '—';
    }
    const invoiceLabel = invoice?.invoiceId || invoice?.orderId || '—';
    if (paymentInvoiceEl) {
        paymentInvoiceEl.textContent = invoiceLabel;
    }

    if (paymentLinkEl) {
        if (invoice?.paymentUrl) {
            paymentLinkEl.href = invoice.paymentUrl;
            paymentLinkEl.classList.remove('hidden');
            paymentLinkEl.style.display = 'inline-block';
            console.log('Payment URL set:', invoice.paymentUrl);
        } else {
            console.warn('No paymentUrl in invoice:', invoice);
            paymentLinkEl.href = '#';
            paymentLinkEl.classList.add('hidden');
            paymentLinkEl.style.display = 'none';
        }
    }

    paymentBackdrop.classList.remove('hidden');
    paymentModal.classList.remove('hidden');
}

function hidePaymentModal() {
    paymentBackdrop?.classList.add('hidden');
    paymentModal?.classList.add('hidden');
}

async function copyPaymentAddress() {
    if (!paymentAddressText) return;
    const address = paymentAddressText.textContent?.trim();
    if (!address || address === '—') return;

    try {
        await navigator.clipboard.writeText(address);
        if (copyAddressButton) {
            const defaultText = copyAddressButton.textContent;
            copyAddressButton.textContent = 'Скопировано!';
            setTimeout(() => {
                if (copyAddressButton) {
                    copyAddressButton.textContent = defaultText || 'Скопировать';
                }
            }, 2000);
        }
    } catch (error) {
        console.error('Clipboard error:', error);
    }
}

function openCloudPaymentsWidget(data) {
    // Load CloudPayments widget script if not already loaded
    if (!window.cp) {
        const script = document.createElement('script');
        script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments';
        script.onload = () => {
            initCloudPaymentsWidget(data);
        };
        script.onerror = () => {
            alert('Failed to load CloudPayments widget. Please check your internet connection.');
        };
        document.head.appendChild(script);
    } else {
        initCloudPaymentsWidget(data);
    }
}

function initCloudPaymentsWidget(data) {
    if (!window.cp) {
        alert('CloudPayments widget failed to load. Card payment is not available yet. Please use crypto payment.');
        // Reset buttons
        resetPaymentButtons();
        return;
    }

    try {
        // CloudPayments widget initialization
        const widget = new window.cp.CloudPayments();
        
        widget.pay('charge', {
            publicId: data.publicId,
            description: `Subscription for $${data.amount}/month`,
            amount: parseFloat(data.amount),
            currency: 'USD',
            invoiceId: data.invoiceId,
            accountId: data.orderId,
            email: null,
            skin: 'mini',
            data: {
                userId: getUserId(),
                orderId: data.orderId
            }
        }, {
            onSuccess: (options) => {
                console.log('CloudPayments payment successful:', options);
                alert('Payment successful! Your subscription is now active.');
                // Refresh status
                const userId = getUserId();
                fetchStatus(userId).then(status => {
                    updateSubscriptionBanner(status);
                    updateSubscriptionSection(status);
                });
                resetPaymentButtons();
            },
            onFail: (reason, options) => {
                console.error('CloudPayments payment failed:', reason, options);
                alert('Payment failed: ' + (reason || 'Unknown error'));
                resetPaymentButtons();
            },
            onComplete: (paymentResult, options) => {
                console.log('CloudPayments payment complete:', paymentResult, options);
                resetPaymentButtons();
            }
        });
    } catch (error) {
        console.error('CloudPayments widget error:', error);
        alert('Failed to open payment widget. Card payment is not available yet. Please use crypto payment.');
        resetPaymentButtons();
    }
}

async function handlePayWithCryptoDirect(event) {
    const button = event?.target;
    if (!button) return;

    // Get payment method from button data attribute
    const paymentMethod = button.dataset.method || 'crypto'; // 'crypto' or 'card'
    
    // Store original text if not stored
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
    }
    const defaultText = button.dataset.originalText;
    
    button.disabled = true;
    button.textContent = 'Creating invoice...';

    try {
        const userId = getUserId();
        console.log('Creating invoice for userId:', userId, 'paymentMethod:', paymentMethod);
        
        // Use different endpoints for crypto and card payments
        const endpoint = paymentMethod === 'card' 
            ? `${API_BASE_URL}/api/payments/cloudpayments/invoice`
            : `${API_BASE_URL}/api/payments/cryptocloud/invoice`;
        
        console.log('API URL:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('Invoice error response:', errorBody);
            console.error('Response status:', response.status);
            
            let errorMessage = 'Failed to create invoice. Please try again later.';
            
            // Try to extract error message from different possible formats
            if (errorBody.message) {
                errorMessage = errorBody.message;
            } else if (errorBody.error) {
                if (errorBody.error === 'cryptocloud_not_configured') {
                    errorMessage = 'Crypto payment system is not configured. Please contact support.';
                } else if (errorBody.error === 'cloudpayments_not_configured') {
                    errorMessage = 'Card payment is not available yet. Please use crypto payment or contact support.';
                } else if (errorBody.error === 'cryptocloud_invoice_failed') {
                    if (errorBody.details) {
                        // If details is an object, try to extract message from it
                        if (typeof errorBody.details === 'object' && errorBody.details.message) {
                            errorMessage = errorBody.details.message;
                        } else if (typeof errorBody.details === 'string') {
                            errorMessage = errorBody.details;
                        } else {
                            errorMessage = 'Payment gateway error. Please check your CryptoCloud configuration.';
                        }
                    } else {
                        errorMessage = 'Payment gateway error. Please try again later.';
                    }
                } else {
                    errorMessage = `Payment error: ${errorBody.error}`;
                }
            } else if (typeof errorBody === 'string') {
                errorMessage = errorBody;
            }
            
            console.error('Full error response:', JSON.stringify(errorBody, null, 2));
            alert(errorMessage);
            button.disabled = false;
            button.textContent = defaultText;
            throw new Error('invoice_failed');
        }

        const data = await response.json();
        console.log('Invoice created successfully:', data);
        lastInvoiceData = data;
        
        // For card payments, use CloudPayments widget
        if (paymentMethod === 'card' && data.publicId) {
            console.log('Opening CloudPayments widget for card payment');
            // CloudPayments widget will be opened
            openCloudPaymentsWidget(data);
            // Reset button after a short delay to allow widget to open
            setTimeout(() => {
                button.disabled = false;
                button.textContent = defaultText;
            }, 500);
        } 
        // For crypto payments, open payment URL in new tab
        else if (data.paymentUrl) {
            console.log('Opening payment URL in new tab:', data.paymentUrl);
            // Always open in new tab, never redirect current page
            const paymentWindow = window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
            
            if (!paymentWindow) {
                // Browser blocked popup - ask user to allow popups
                console.warn('Popup blocked by browser');
                showPaymentInfoMessage(`Открой ссылку вручную: ${data.paymentUrl}`);
                button.disabled = false;
                button.textContent = defaultText;
                return;
            } else {
                button.textContent = 'Payment page opened';
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = defaultText;
                }, 2000);
            }
        } else if (data.address) {
            // If no paymentUrl but we have address, show modal with address
            console.log('No paymentUrl, but address available:', data.address);
            showPaymentModal(data);
            button.disabled = false;
            button.textContent = defaultText;
        } else {
            console.error('No paymentUrl or address in response:', data);
            alert('Payment URL not available. Please try again.');
            button.disabled = false;
            button.textContent = defaultText;
        }
    } catch (error) {
        console.error('Unable to create invoice:', error);
        if (error.message !== 'invoice_failed') {
            alert('Network error. Please check if backend is running on port 4000.');
        }
        // Always reset button state on error
        if (button) {
            button.disabled = false;
            button.textContent = button.dataset.originalText || defaultText;
        }
    }
}

async function handlePayWithCrypto(event) {
    const button = event?.target || payCryptoButton || subscriptionOverlayButton;
    if (!button) return;

    const defaultText = button.textContent;
    const wasDisabled = button.disabled;
    button.disabled = true;
    button.textContent = 'Creating invoice...';

    try {
        const userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/api/payments/apirone/invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('Invoice error:', errorBody);
            throw new Error('invoice_failed');
        }

        const data = await response.json();
        lastInvoiceData = data;
        
        // Hide subscription overlay if visible
        if (subscriptionOverlay) {
            subscriptionOverlay.classList.add('hidden');
        }
        
        // Show payment modal with correct link
        showPaymentModal(data);
        
        if (subscriptionTextEl) {
            subscriptionTextEl.textContent = 'Счёт создан. После подтверждения транзакции сетью подписка активируется автоматически.';
        }
    } catch (error) {
        console.error('Unable to create invoice:', error);
        alert('Failed to create invoice. Please try again later.');
    } finally {
        button.disabled = wasDisabled;
        button.textContent = defaultText;
    }
}

const chatButton = document.getElementById('chatButton');
const chatContainer = document.getElementById('chatContainer');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const subscriptionBanner = document.getElementById('subscriptionBanner');
const subscriptionTextEl = document.getElementById('subscriptionText');
const payCryptoButton = document.getElementById('payCryptoButton');
const paymentBackdrop = document.getElementById('paymentBackdrop');
const paymentModal = document.getElementById('paymentModal');
const paymentAmountEl = document.getElementById('paymentAmount');
const paymentAddressText = paymentModal?.querySelector('.payment-address-text');
const paymentInvoiceEl = document.getElementById('paymentInvoiceId');
const paymentLinkEl = document.getElementById('paymentLink');
const paymentCloseButton = document.getElementById('paymentCloseButton');
const copyAddressButton = document.getElementById('copyAddressButton');

const subscriptionSection = document.getElementById('subscriptionSection');
const timerContainer = document.getElementById('timerContainer');
const timerDisplay = document.getElementById('timerDisplay');
const subscriptionMessageBox = document.getElementById('subscriptionMessageBox');
const subscribeButton = document.getElementById('subscribeButton');
const subscriptionOverlay = document.getElementById('subscriptionOverlay');
const subscriptionOverlayButton = document.getElementById('subscriptionOverlayButton');
const chatExpiredOverlay = document.getElementById('chatExpiredOverlay');
const chatExpiredButton = document.getElementById('chatExpiredButton');
const chatMessages = document.getElementById('chatMessages');
const chatInputContainer = document.querySelector('.chat-input-container');

let currentSubscriptionStatus = null;
let lastInvoiceData = null;
let countdownInterval = null;

function resetPaymentButtons() {
    // Reset all payment buttons to default state
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        const originalText = btn.dataset.originalText || btn.textContent;
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = originalText;
        }
        btn.disabled = false;
        btn.textContent = originalText;
    });

    // Reset subscription text to default message if stored
    if (subscriptionTextEl) {
        if (!subscriptionTextEl.dataset.defaultText) {
            subscriptionTextEl.dataset.defaultText = subscriptionTextEl.textContent;
        } else {
            subscriptionTextEl.textContent = subscriptionTextEl.dataset.defaultText;
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const userId = getUserId();
    const status = await fetchStatus(userId);
    
    updateSubscriptionBanner(status);
    updateSubscriptionSection(status);
    
    // Reset all payment buttons to default state
    resetPaymentButtons();
    
    // Add event listeners for payment method buttons
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handlePayWithCryptoDirect(e));
    });
});

// Reset buttons when user returns to the page
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page is visible again - reset buttons
        resetPaymentButtons();
    }
});

// Also reset on window focus (when user switches back to tab)
window.addEventListener('focus', () => {
    resetPaymentButtons();
});

function showPaymentInfoMessage(message) {
    if (!message) return;
    if (subscriptionTextEl) {
        if (!subscriptionTextEl.dataset.defaultText) {
            subscriptionTextEl.dataset.defaultText = subscriptionTextEl.textContent;
        }
        subscriptionTextEl.textContent = message;
    }
}

chatButton?.addEventListener('click', () => {
    chatContainer?.classList.add('active');
});

closeChat?.addEventListener('click', () => {
    chatContainer?.classList.remove('active');
});

payCryptoButton?.addEventListener('click', (e) => handlePayWithCrypto(e));
subscribeButton?.addEventListener('click', (e) => handlePayWithCrypto(e));
subscriptionOverlayButton?.addEventListener('click', (e) => handlePayWithCrypto(e));
// Handle payment method buttons (crypto or card)
document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handlePayWithCryptoDirect(e));
});
paymentBackdrop?.addEventListener('click', hidePaymentModal);
paymentCloseButton?.addEventListener('click', hidePaymentModal);
copyAddressButton?.addEventListener('click', copyPaymentAddress);

const cryptoSources = {
    bitcoin: [
        { url: 'https://bitcoin.org/', title: 'Bitcoin Official Website' },
        { url: 'https://www.investopedia.com/terms/b/bitcoin.asp', title: 'Investopedia: What is Bitcoin' }
    ],
    ethereum: [
        { url: 'https://ethereum.org/', title: 'Ethereum Official Website' },
        { url: 'https://www.investopedia.com/terms/e/ethereum.asp', title: 'Investopedia: What is Ethereum' }
    ],
    blockchain: [
        { url: 'https://www.investopedia.com/terms/b/blockchain.asp', title: 'Investopedia: Blockchain Explained' },
        { url: 'https://www.ibm.com/topics/blockchain', title: 'IBM: What is Blockchain' }
    ],
    'smart contract': [
        { url: 'https://ethereum.org/en/smart-contracts/', title: 'Ethereum: Smart Contracts' },
        { url: 'https://www.investopedia.com/terms/s/smart-contracts.asp', title: 'Investopedia: Smart Contracts' }
    ],
    defi: [
        { url: 'https://ethereum.org/en/defi/', title: 'Ethereum: DeFi Guide' },
        { url: 'https://www.investopedia.com/decentralized-finance-defi-5113835', title: 'Investopedia: DeFi Explained' }
    ],
    nft: [
        { url: 'https://ethereum.org/en/nft/', title: 'Ethereum: NFT Guide' },
        { url: 'https://www.investopedia.com/non-fungible-tokens-nft-5115211', title: 'Investopedia: What are NFTs' }
    ],
    wallet: [
        { url: 'https://ethereum.org/en/wallets/', title: 'Ethereum: Wallet Guide' },
        { url: 'https://www.investopedia.com/terms/b/bitcoin-wallet.asp', title: 'Investopedia: Crypto Wallets' }
    ],
    staking: [
        { url: 'https://ethereum.org/en/staking/', title: 'Ethereum: Staking Guide' },
        { url: 'https://www.investopedia.com/terms/p/proof-stake-pos.asp', title: 'Investopedia: Proof of Stake' }
    ],
    mining: [
        { url: 'https://www.investopedia.com/tech/how-does-bitcoin-mining-work/', title: 'Investopedia: Bitcoin Mining' },
        { url: 'https://academy.binance.com/en/articles/what-is-cryptocurrency-mining', title: 'Binance: Crypto Mining' }
    ],
    trading: [
        { url: 'https://www.investopedia.com/cryptocurrency-trading-4427869', title: 'Investopedia: Crypto Trading' },
        { url: 'https://academy.binance.com/en/start-here', title: 'Binance Academy: Trading Basics' }
    ],
    market: [
        { url: 'https://coinmarketcap.com/', title: 'CoinMarketCap: Market Data' },
        { url: 'https://www.coingecko.com/', title: 'CoinGecko: Crypto Prices' }
    ],
    scam: [
        { url: 'https://www.investopedia.com/articles/forex/042115/beware-these-five-bitcoin-scams.asp', title: 'Investopedia: Common Crypto Scams' },
        { url: 'https://www.consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams', title: 'FTC: Cryptocurrency Scams' }
    ],
    dao: [
        { url: 'https://ethereum.org/en/dao/', title: 'Ethereum: DAO Guide' },
        { url: 'https://www.investopedia.com/tech/what-dao/', title: 'Investopedia: What is a DAO' }
    ],
    altcoin: [
        { url: 'https://www.investopedia.com/terms/a/altcoin.asp', title: 'Investopedia: Altcoins Explained' },
        { url: 'https://coinmarketcap.com/all/views/all/', title: 'CoinMarketCap: All Altcoins' }
    ],
    gas: [
        { url: 'https://ethereum.org/en/developers/docs/gas/', title: 'Ethereum: Gas Explained' },
        { url: 'https://www.investopedia.com/terms/g/gas-ethereum.asp', title: 'Investopedia: Gas Fees' }
    ]
};

const cryptoKnowledge = {
    bitcoin: {
        keywords: ['bitcoin', 'btc', 'satoshi'],
        response: 'Bitcoin (BTC) is the first and most well-known cryptocurrency, created in 2009 by Satoshi Nakamoto. It is a decentralised digital currency secured by proof-of-work mining and recorded on a public blockchain ledger.',
        topic: 'bitcoin'
    },
    ethereum: {
        keywords: ['ethereum', 'eth', 'ether', 'vitalik'],
        response: 'Ethereum (ETH) is a decentralised blockchain launched in 2015 that enables smart contracts and dApps. Its native currency, Ether, is used to pay gas fees and secure the network through proof-of-stake validators.',
        topic: 'ethereum'
    },
    blockchain: {
        keywords: ['blockchain', 'chain', 'distributed ledger', 'dlt'],
        response: 'A blockchain is a distributed ledger of transactions grouped into blocks, each linked cryptographically to the previous. This design provides transparency, security, and immutability without relying on a central authority.',
        topic: 'blockchain'
    },
    consensus: {
        keywords: ['consensus', 'consensus mechanism', 'validator', 'node'],
        response: 'Consensus mechanisms ensure all nodes agree on the state of the ledger. Popular approaches include proof-of-work (miners solve puzzles) and proof-of-stake (validators lock tokens). They keep the network secure and decentralised.',
        topic: 'blockchain'
    },
    pow: {
        keywords: ['proof of work', 'pow', 'mining', 'hash rate'],
        response: 'Proof-of-work lets miners compete with computing power to add new blocks. The first to solve the puzzle gets the block reward. It is robust but energy intensive. Bitcoin still uses PoW today.',
        topic: 'mining'
    },
    pos: {
        keywords: ['proof of stake', 'pos', 'staking'],
        response: 'Proof-of-stake selects validators based on the amount of cryptocurrency they stake. It consumes far less energy than PoW and is used by Ethereum, Cardano, Solana and many others.',
        topic: 'staking'
    },
    wallet: {
        keywords: ['wallet', 'hardware wallet', 'self-custody'],
        response: 'Crypto wallets store private keys that control your coins. Hot wallets are online and convenient, while cold wallets (hardware/offline) offer maximum security. Always back up your seed phrase and never share it.',
        topic: 'wallet'
    },
    keys: {
        keywords: ['private key', 'seed phrase', 'recovery phrase'],
        response: 'Your private key proves ownership of funds, and a seed phrase backs it up. Keep them secret and offline. If someone else gets them, they control your crypto.',
        topic: 'wallet'
    },
    altcoin: {
        keywords: ['altcoin', 'alt', 'shitcoin'],
        response: 'Altcoins are any cryptocurrencies other than Bitcoin. They range from major platforms like Ethereum to niche experimental projects. Always research tokenomics, team and use case before investing.',
        topic: 'altcoin'
    },
    defi: {
        keywords: ['defi', 'dex', 'amm', 'yield farming'],
        response: 'DeFi (Decentralised Finance) lets you trade, lend, borrow and earn yield without banks. Protocols like Uniswap, Aave and Compound run on smart contracts and use liquidity pools rather than order books.',
        topic: 'defi'
    },
    dex: {
        keywords: ['dex', 'decentralized exchange', 'uniswap'],
        response: 'DEXs are peer-to-peer exchanges. You keep custody of your assets, and trades are executed via automated market makers (AMMs). Liquidity providers supply tokens to earn fees.',
        topic: 'defi'
    },
    nft: {
        keywords: ['nft', 'non-fungible token'],
        response: 'NFTs are unique digital assets on a blockchain. They represent art, collectibles, in-game items, tickets and more. Marketplaces such as OpenSea and Blur make trading NFTs easy.',
        topic: 'nft'
    },
    token: {
        keywords: ['token', 'governance token', 'utility token'],
        response: 'Tokens are digital assets created on existing blockchains. Utility tokens unlock services, governance tokens provide voting rights and security tokens represent ownership. Ethereum ERC-20 is the most common standard.',
        topic: 'ethereum'
    },
    stablecoin: {
        keywords: ['stablecoin', 'usdt', 'usdc', 'dai'],
        response: 'Stablecoins track fiat currencies, giving crypto traders a stable store of value. USDT and USDC are fiat-backed, while DAI is crypto-collateralised. They help manage volatility and move funds between platforms.',
        topic: 'trading'
    },
    'smart contract': {
        keywords: ['smart contract', 'dapp', 'protocol'],
        response: 'Smart contracts are programs stored on a blockchain that execute automatically when conditions are met. They power dApps, DeFi, NFTs and DAOs by removing intermediaries and enforcing trustless logic.',
        topic: 'smart contract'
    },
    'gas fee': {
        keywords: ['gas', 'gas fee', 'gwei'],
        response: 'Gas fees pay validators for processing transactions. On Ethereum, gas is measured in gwei. Fees fluctuate with network demand. Layer 2 networks offer cheaper alternatives.',
        topic: 'gas'
    },
    dao: {
        keywords: ['dao', 'decentralized autonomous organization'],
        response: 'DAOs are internet-native organisations governed by token holders. Proposals are voted on and executed automatically through smart contracts, keeping operations transparent and decentralised.',
        topic: 'dao'
    },
    hodl: {
        keywords: ['hodl', 'diamond hands'],
        response: 'HODL is crypto slang for holding long-term despite volatility. Diamond hands means staying strong through dips, while paper hands sell at the first sign of trouble.',
        topic: 'trading'
    },
    fomo: {
        keywords: ['fomo'],
        response: 'FOMO (Fear Of Missing Out) describes the urge to buy when prices are pumping. Successful traders follow a plan instead of chasing hype. Always do your own research (DYOR).',
        topic: 'trading'
    },
    fud: {
        keywords: ['fud'],
        response: 'FUD stands for fear, uncertainty and doubt—negative news (sometimes fake) used to shake confidence. Verify facts and stick to fundamentals rather than reacting emotionally.',
        topic: 'trading'
    },
    whale: {
        keywords: ['whale', 'bag holder'],
        response: 'Whales hold enough crypto to move markets. Track large wallets to anticipate volatility. A bagholder is someone stuck with tokens that dropped in value.',
        topic: 'trading'
    },
    pump: {
        keywords: ['pump', 'dump', 'rug pull'],
        response: 'Pump-and-dump schemes artificially inflate prices so insiders can sell. Rug pulls happen when developers abandon a project and drain liquidity. Watch for red flags and always DYOR.',
        topic: 'scam'
    },
    security: {
        keywords: ['security', 'phishing', 'hack', 'exploit'],
        response: 'Security best practices: use hardware wallets, enable 2FA, verify URLs, and beware of phishing and fake support. Smart contract audits help uncover vulnerabilities but are not a guarantee.',
        topic: 'scam'
    },
    oracle: {
        keywords: ['oracle', 'chainlink'],
        response: 'Oracles deliver real-world data (like prices) to smart contracts. Chainlink is the leading decentralised oracle network. Bridges connect different blockchains but can be security hotspots.',
        topic: 'smart contract'
    }
};

function getSourcesForQuestion(question) {
    if (!question) return null;
    const lowerQuestion = question.toLowerCase();

    const termMap = {
        bitcoin: ['bitcoin', 'btc', 'satoshi'],
        ethereum: ['ethereum', 'eth', 'ether', 'vitalik', 'erc'],
        nft: ['nft', 'non-fungible', 'collectible', 'opensea'],
        defi: ['defi', 'dex', 'amm', 'liquidity', 'yield', 'uniswap'],
        staking: ['staking', 'pos', 'validator'],
        mining: ['mining', 'pow', 'hashrate', 'asic'],
        wallet: ['wallet', 'ledger', 'metamask', 'seed', 'private key'],
        scam: ['scam', 'rug pull', 'phishing', 'exploit'],
        dao: ['dao', 'governance', 'proposal'],
        'smart contract': ['smart contract', 'dapp', 'protocol'],
        trading: ['trading', 'hodl', 'fomo', 'whale', 'bull', 'bear'],
        market: ['market cap', 'ath', 'atl', 'volume'],
        gas: ['gas', 'gwei', 'fee'],
        blockchain: ['blockchain', 'distributed ledger'],
        altcoin: ['altcoin', 'alt']
    };

    for (const [topic, keywords] of Object.entries(termMap)) {
        if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
            return cryptoSources[topic] ?? null;
        }
    }

    return null;
}

function getFallbackResponse(question) {
    const lowerQuestion = question.toLowerCase();

    const cryptoRelated = [
        'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'altcoin',
        'token', 'mining', 'staking', 'wallet', 'defi', 'dex', 'yield',
        'nft', 'stablecoin', 'dao', 'gas', 'trade', 'trading', 'market',
        'hodl', 'fomo', 'fud', 'whale', 'pump', 'rug', 'security', 'oracle'
    ].some(keyword => lowerQuestion.includes(keyword));

    if (!cryptoRelated) {
        return "Я крипто-ассистент. Расскажу про Bitcoin, DeFi, NFT, безопасность, трейдинг и всё, что связано с блокчейном. Задай вопрос!";
    }

    for (const { keywords, response } of Object.values(cryptoKnowledge)) {
        if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
            return response;
        }
    }

    return 'Отличный вопрос! 🚀 Расскажи подробнее, что именно тебя интересует: Bitcoin, DeFi, NFT, трейдинг, безопасность или что-то другое?';
}

async function getCryptoResponse(question) {
    const userId = getUserId();
    const status = await fetchStatus(userId);

    updateSubscriptionBanner(status);

    if (status && !status.hasAccess) {
        const trialEndText = formatDateTime(status.freeTrialEndsAt);
        const dateFragment = trialEndText ? ` (${trialEndText})` : '';
        return `Бесплатный доступ завершён${dateFragment}. Нажмите кнопку «Оплатить криптой» выше, чтобы оформить подписку за $10 в месяц.`;
    }

    const result = await requestChatResponse(userId, question);

    if (result?.error === 'subscription_required') {
        return 'Доступ ограничен. Используйте кнопку «Оплатить криптой» на странице, чтобы продлить подписку.';
    }

    if (result?.error === 'chat_failed') {
        return 'Не удалось получить ответ от ассистента. Попробуйте ещё раз позже.';
    }

    if (result?.answer) {
        return result.answer;
    }

    return getFallbackResponse(question);
}

function addMessage(content, isUser = false, question = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '🐻' : '🇺🇸';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;

    if (!isUser && question) {
        const sources = getSourcesForQuestion(question);
        if (sources?.length) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';
            sources.slice(0, 2).forEach(source => {
                const link = document.createElement('a');
                link.href = source.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = source.title;
                sourcesDiv.appendChild(link);
            });
            messageContent.appendChild(sourcesDiv);
        }
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages?.appendChild(messageDiv);
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🇺🇸';

    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator active';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    typingContent.appendChild(dots);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);
    chatMessages?.appendChild(typingDiv);
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function removeTyping() {
    document.getElementById('typingIndicator')?.remove();
}

async function sendMessage() {
    const message = chatInput?.value.trim();
    if (!message) return;

    const currentQuestion = message;
    addMessage(currentQuestion, true);
    if (chatInput) chatInput.value = '';

    showTyping();

    try {
        const response = await getCryptoResponse(currentQuestion);
        removeTyping();
        addMessage(response, false, currentQuestion);
    } catch (error) {
        console.error('Response error:', error);
        removeTyping();
        addMessage('Sorry, something went wrong. Please try again a bit later! 🔄', false);
    }
}

sendButton?.addEventListener('click', sendMessage);
chatInput?.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        hidePaymentModal();
    }
});

document.addEventListener('click', event => {
    const target = event.target;
    if (target instanceof HTMLElement && target.classList.contains('quick-question-btn')) {
        const question = target.getAttribute('data-question');
        if (question && chatInput) {
            chatInput.value = question;
            sendMessage();
        }
    }
});
