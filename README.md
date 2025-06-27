# Shell Game Captcha!
A shell game captcha created for the Kitboga Code Jam 2025.
## Overview
This captcha requires tracking which wallet, out of three wallets, contains a bitcoin as they are swapped around randomly. 
## Features
The difficulty of this game is primarily controlled by three parameters: starting swap rate, ending swap rate, and game duration. Swap rate is defined as the number of swaps per a second. The game will interpolate between the starting and ending swap rate over the duration of the game following a configurable easing function. Various easing functions to try out are available [here](https://easings.net). After swapping has concluded, the player is asked to select a wallet. The game will restart if the wallet does not contain the coin. 

Thank you to Kitboga and team for hosting this event!