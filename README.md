# Shell Game Captcha!
A shell game captcha created for the Kitboga code jam 2025.
## Overview
This captcha requires tracking which wallet, out of three wallets, contains a bitcoin as they are swapped around randomly. 
## Features
The difficulty of this game is primarily controlled by three parameters: starting swap rate, ending swap rate, and game duration. Swap rate is defined as the number of swaps per a second. The game will interpolate between the starting and ending swap rate over the duration of the game following a configurable easing function. I found that a linear or ease-out function worked the best. After the game duration is exceeded, the player will select a wallet. If the wallet does not contain the coin, the game will start again. 

Thank you to Kitboga and team for hosting this event!