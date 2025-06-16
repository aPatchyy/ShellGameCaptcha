const MIN_SWAP_RATE = 1     // Swaps-per-second at game start.
const MAX_SWAP_RATE = 5     // Swaps-per-second at game end.
const GAME_DURATION = 30 * 1000     // Length of time (miliseconds) over which swapping occurs.

const container = document.getElementById("captcha-container")
const instructionMessage = document.getElementById("instruction-message")
const selectionMessage = document.getElementById("selection-message")
const successMessage = document.getElementById("success-message")
const failMessage = document.getElementById("fail-message")
const openWallet = document.getElementById("wallet-open")
const coin = document.getElementById("coin")

const WALLETS = [ document.getElementById("wallet-1"), document.getElementById("wallet-2"), document.getElementById("wallet-3")]
const POSITIONS = ["left", "center", "right"]
const WALLET_SPACING = container.getBoundingClientRect().width * 0.6 / 2

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
    {top: "25%", transform: "translate(-50%, -50%) scale(1,1)"}
]

let startTime
let gameTime = 0
let coinOscillationPlayer = coin.animate([{transform: "translate(-50%, -75%)"}], {duration: 500, direction: "alternate", iterations: Number.MAX_SAFE_INTEGER, easing: "ease-in-out"})


initialize()
window.addEventListener("pointerdown", handleGameStart)

container.addEventListener("contextmenu", (e)=>e.preventDefault())


function initialize() {
    gameTime = 0
    hide(failMessage)
    hide(openWallet)
    show(instructionMessage)
    show(coin)
    coinOscillationPlayer.play()
    WALLETS.forEach((wallet, index) => {
        show(wallet)
        wallet.classList.remove(...POSITIONS)
        wallet.classList.add(POSITIONS[index])
    })
}

function handleGameStart() {
    window.removeEventListener("pointerdown", handleGameStart)
    startTime = Date.now()
    hide(instructionMessage)
    coinOscillationPlayer.pause()
    coin.animate({top: "50%", left:"50%"}, {duration: 1000, easing: "ease-out"}).finished.then(e => {
        coin.classList.add("center")
        hide(coin)
        update()
    })
}

function handleGameRestart() {
    window.removeEventListener("pointerdown", handleGameRestart)
    initialize()
    hide(instructionMessage)
    setTimeout(() => {
        handleGameStart()
    }, 1000)
}

function handleWalletSelection(e) {
    WALLETS.forEach(wallet => {
            wallet.removeEventListener("pointerdown", handleWalletSelection)
    })
    hide(selectionMessage)
    const selectedWallet = e.target.parentElement
    WALLETS.filter(wallet => wallet !== selectedWallet).forEach(wallet => hide(wallet))
    if(!Array.from(selectedWallet.classList).includes("center")) {
        selectedWallet.animate({left: "50%"}, {duration: 1000, easing: "ease-in-out"}).finished.then(e => {
            selectedWallet.classList.remove(...POSITIONS)
            selectedWallet.classList.add("center")
            revealWallet(selectedWallet)
        })
    } else {
        revealWallet(selectedWallet)
    }
}

function revealWallet(selectedWallet) {
    selectedWallet.animate(SHAKE_KEYFRAMES, { duration: 1000, direction: "normal", iterations: 2}).finished.then(e => {
        hide(selectedWallet)
        show(openWallet)
        if(selectedWallet === WALLETS[1]) {
            show(successMessage)
            show(coin)
            coin.animate(SUCCESS_COIN_KEYFRAMES, {duration: 1000, easing: "ease-in-out"}).finished.then(e => {
                coin.classList.remove("center")
                coinOscillationPlayer.play()
            })
            setTimeout(() => {
                window.top.postMessage("success", '*');
            }, 3000);
        } else {
            show(failMessage)
            show(instructionMessage)
            instructionMessage.querySelector("h2").textContent = "Try again?"
            window.addEventListener("pointerdown", handleGameRestart)
        }
    })
}

function update() {
    gameTime = Date.now() - startTime
    const wallet1 = WALLETS[Math.floor(Math.random() * WALLETS.length)]
    const wallet2 = WALLETS.filter(wallet => wallet != wallet1)[Math.floor(Math.random() * (WALLETS.length - 1))]
    const duration = 1000 / currentSwapRate()
    swap(wallet1, wallet2, duration)

    if(gameTime < GAME_DURATION) {
        setTimeout(() => {
            update()
        }, duration);
    } else {
        setTimeout(() => {
            show(selectionMessage)
            WALLETS.forEach(wallet => {
                wallet.addEventListener("pointerdown", handleWalletSelection)
            })
        }, 250);
    }
}

function swap(wallet1, wallet2, duration) {
    const position1 = Array.from(wallet1.classList).filter(c => POSITIONS.includes(c))[0]
    const position2 = Array.from(wallet2.classList).filter(c => POSITIONS.includes(c))[0]
    const positionIndex1 = POSITIONS.indexOf(position1)
    const positionIndex2 = POSITIONS.indexOf(position2)
    const deltaX = (positionIndex2 - positionIndex1) * 117
    const deltaY = (Math.abs(positionIndex2 - positionIndex1) - 1) * 50 + 100
    wallet1.style.offsetPath = `path("M 0 0 C 0 -${deltaY} ${deltaX} -${deltaY} ${deltaX} 0")` //moves in +x
    wallet2.style.offsetPath = `path("M 0 0 C 0 ${deltaY} ${-1 * deltaX} ${deltaY} ${-1 * deltaX} 0")` //moves in -x
    wallet1.animate([{offsetDistance: "0%"},{offsetDistance: "100%"}], {duration: duration - 20, iterations: 1})
    wallet2.animate([{offsetDistance: "0%"},{offsetDistance: "100%"}], {duration: duration - 20, iterations: 1})
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
    let t = gameTime / GAME_DURATION
    return (MAX_SWAP_RATE * t + MIN_SWAP_RATE * (1 - t))
}

function hide(element) {
    element.classList.add("hide")
}

function show(element) {
    element.classList.remove("hide")
}