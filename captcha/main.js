const START_SWAP_RATE = 2       // Swaps-per-second at game start.
const END_SWAP_RATE = 6     // Swaps-per-second at game end.
const GAME_DURATION = 30 * 1000     // Length of time (miliseconds) during which swapping occurs.
const ALLOW_CONSECUTIVE_SWAPPING = false        // Allows the same pair of wallets to be swapped consecutively.
const SWAP_RATE_EASING = (x) => 1 - (x-1)*(x-1)       // An easing function dictating how swap rate moves from START to END over the game duration.

const container = document.getElementById("captcha-container")
const instructionMessage = document.getElementById("instruction-message")
const selectionMessage = document.getElementById("selection-message")
const successMessage = document.getElementById("success-message")
const openWallet = document.getElementById("wallet-open")
const coin = document.getElementById("coin")
const starburst = document.getElementById("starburst-wrapper")
const wallets = [ document.getElementById("wallet-1"), document.getElementById("wallet-2"), document.getElementById("wallet-3")]
const POSITIONS = ["left", "center", "right"]
const WALLET_SPACING = wallets[1].getBoundingClientRect().left - wallets[0].getBoundingClientRect().left

const SHAKE_KEYFRAMES = [
    {transform: "translate(calc(-50% + 1px), calc(-50% - 1px)) rotate(0deg)"},
    {transform: "translate(calc(-50% + -1px), calc(-50% + -2px)) rotate(-1deg)"},
    {transform: "translate(calc(-50% + -3px), calc(-50% + 0px)) rotate(1deg)"},
    {transform: "translate(calc(-50% + 3px), calc(-50% + 2px)) rotate(0deg)"},
    {transform: "translate(calc(-50% + 1px), calc(-50% + -1px)) rotate(1deg)"},
    {transform: "translate(calc(-50% + -1px), calc(-50% + 2px)) rotate(-1deg)"},
    {transform: "translate(calc(-50% + -3px), calc(-50% + 1px)) rotate(0deg)"},
    {transform: "translate(calc(-50% + 3px), calc(-50% + 1px)) rotate(-1deg)"},
    {transform: "translate(calc(-50% + -1px), calc(-50% + -1px)) rotate(1deg)"},
    {transform: "translate(calc(-50% + 1px), calc(-50% + 2px)) rotate(0deg)"},
    {transform: "translate(calc(-50% + 1px), calc(-50% + -2px)) rotate(-1deg)"},
]

const SUCCESS_COIN_KEYFRAMES = [
    {top: "50%", transform: "translate(-50%, -50%) scale(0, 0)"}, 
    {top: "20%", transform: "translate(-50%, -50%) scale(1,1)"}
]

let startTime
let gameTime = 0
let coinOscillationPlayer = coin.animate([{transform: "translate(-50%, -75%)"}], {duration: 500, direction: "alternate", iterations: Number.MAX_SAFE_INTEGER, easing: "ease-in-out"})
let lastSwappedWallet

initialize()


setTimeout(() => {
    container.addEventListener("pointerdown", handleGameStart)
    show(instructionMessage.querySelector("span"))
}, 1000);


container.addEventListener("contextmenu", (e)=>e.preventDefault())


function initialize() {
    gameTime = 0
    hide(openWallet)
    show(instructionMessage)
    show(coin)
    coinOscillationPlayer.play()
    wallets.forEach((wallet, index) => {
        setWalletPosition(wallet, POSITIONS[index])
        show(wallet)
    })
}

function handleGameStart() {
    container.removeEventListener("pointerdown", handleGameStart)
    startTime = Date.now()
    hide(instructionMessage)
    coinOscillationPlayer.pause()
    coin.animate({top: "50%", left:"50%", transform: "translate(-50%, -50%)"}, {duration: 500, easing: "ease-in"}).finished.then(e => {
        coin.classList.add("center")
        coinOscillationPlayer.cancel()
        hide(coin)
        setTimeout(() => {
            update()
        }, 250);
    })
}

function handleGameRestart() {
    container.removeEventListener("pointerdown", handleGameRestart)
    gameTime = 0
    coinOscillationPlayer.play()
    show(coin)
    hide(openWallet)
    hide(instructionMessage)
    wallets.forEach(wallet => {
        setWalletPosition(wallet, "center")
        show(wallet)
    })
    wallets[0].animate({left: "20%"}, {duration: 500, easing: "ease-in-out", delay: 500}).finished.then( e => {
        setWalletPosition(wallets[0], "left")

    })
    wallets[2].animate({left: "80%"}, {duration: 500, easing: "ease-in-out", delay: 500}).finished.then( e => {
        setWalletPosition(wallets[2], "right")
    })
    
    setTimeout(() => {
        handleGameStart()
    }, 1500)
}

function handleWalletSelection(e) {
    wallets.forEach(wallet => {
            wallet.classList.remove("selectable")
            wallet.removeEventListener("pointerdown", handleWalletSelection)
    })
    hide(selectionMessage)
    const selectedWallet = e.target.parentElement
    wallets.filter(wallet => wallet !== selectedWallet).forEach(wallet => hide(wallet))
    if(!Array.from(selectedWallet.classList).includes("center")) {
        selectedWallet.animate({left: "50%"}, {duration: 800, easing: "ease-in-out"}).finished.then(e => {
            setWalletPosition(selectedWallet, "center")
            revealWallet(selectedWallet)
        })
    } else {
        revealWallet(selectedWallet)
    }
}

function revealWallet(selectedWallet) {
    selectedWallet.animate(SHAKE_KEYFRAMES, { delay: 250, duration: 1000, direction: "normal", iterations: 2}).finished.then(e => {
        hide(selectedWallet)
        show(openWallet)
        if(selectedWallet === wallets[1]) {
            show(successMessage)
            show(coin)
            show(starburst)
            coin.animate(SUCCESS_COIN_KEYFRAMES, {duration: 500, easing: "ease-in-out"}).finished.then(e => {
                coin.classList.remove("center")
                coinOscillationPlayer.play()
            })
            setTimeout(() => {
                window.top.postMessage("success", '*');
            }, 3000);
        } else {
            show(instructionMessage)
            instructionMessage.querySelector("h2").textContent = "Try again?"
            container.addEventListener("pointerdown", handleGameRestart)
        }
    })
}

function update() {
    gameTime = Date.now() - startTime
    let wallet1
    let wallet2
    if(ALLOW_CONSECUTIVE_SWAPPING || !lastSwappedWallet) {
        wallet1 = wallets[Math.floor(Math.random() * wallets.length)]
        wallet2 = wallets.filter(wallet => wallet != wallet1)[Math.floor(Math.random() * (wallets.length - 1))]
    } else {
        const swappableWallets = wallets.filter(wallet => wallet !== lastSwappedWallet)
        const randomNumber = Math.random()
        wallet1 = swappableWallets[Math.round(randomNumber)]
        wallet2 = swappableWallets[Math.round(1-randomNumber)]
    }
    lastSwappedWallet = wallet1
    
    const duration = 1000 / currentSwapRate()
    swap(wallet1, wallet2, duration)

    if(gameTime < GAME_DURATION) {
        setTimeout(() => {
            update()
        }, duration);
    } else {
        setTimeout(() => {
            show(selectionMessage)
            wallets.forEach(wallet => {
                wallet.classList.add("selectable")
                wallet.addEventListener("pointerdown", handleWalletSelection)
            })
        }, Math.max(duration, 500));
    }
}

function swap(wallet1, wallet2, duration) {
    const position1 = Array.from(wallet1.classList).filter(c => POSITIONS.includes(c))[0]
    const position2 = Array.from(wallet2.classList).filter(c => POSITIONS.includes(c))[0]
    const positionIndex1 = POSITIONS.indexOf(position1)
    const positionIndex2 = POSITIONS.indexOf(position2)
    const deltaX = (positionIndex2 - positionIndex1) * WALLET_SPACING
    const deltaY = (Math.abs(positionIndex2 - positionIndex1) - 1) * 50 + 100
    wallet1.style.offsetPath = `path("M 0 0 C 0 -${deltaY} ${deltaX} -${deltaY} ${deltaX} 0")` //moves in +x
    wallet2.style.offsetPath = `path("M 0 0 C 0 ${deltaY} ${-1 * deltaX} ${deltaY} ${-1 * deltaX} 0")` //moves in -x
    wallet1.animate([{offsetDistance: "0%"},{offsetDistance: "100%"}], {duration: duration - 20, iterations: 1, easing: "ease-in-out"})
    wallet2.animate([{offsetDistance: "0%"},{offsetDistance: "100%"}], {duration: duration - 20, iterations: 1, easing: "ease-in-out"})
    setTimeout(() => {
        wallet1.classList.replace(position1, position2)
        wallet1.style.offsetPath = "none"
        wallet1.style.offsetDistance = "0"
        wallet2.classList.replace(position2, position1)
        wallet2.style.offsetPath = "none"
        wallet2.style.offsetDistance = "0"
    }, duration);
}

function currentSwapRate() {
    const t = SWAP_RATE_EASING(gameTime / GAME_DURATION)
    return END_SWAP_RATE * t + START_SWAP_RATE * (1 - t)
}

function setWalletPosition(wallet, position) {
    wallet.classList.remove(...POSITIONS)
    wallet.classList.add(position)
}

function hide(element) {
    element.classList.add("hide")
}

function show(element) {
    element.classList.remove("hide")
}