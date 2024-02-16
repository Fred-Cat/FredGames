

// main
let curPage = home
function goto(newPage) {
    curPage.style.display = 'none'
    newPage.style.display = 'block'
    curPage = newPage
}

function updateUI() {

    // head
    dataUserName.innerHTML = user.name
    dataUserFredits.innerHTML = user.fredits.toFixed()
    dataUserValue.innerHTML = user.value.toFixed(2)

    // discover
    dataUploadGameError.innerHTML = ''
    dataPlayCost.innerHTML = parseFloat((inPlayDuration.value / 10).toFixed(1))
    dataPlayGameError.innerHTML = ''

    // ad
    dataAdCost.innerHTML = (inAdAmount.value * inAdDuration.value).toFixed()
    dataPurchaseAdError.innerHTML = ''
    dataWatchAdError.innerHTML = ''

    // fredits
    dataFreditCost.innerHTML = (inFreditAmount.value * inFreditValue.value).toFixed(3)
    dataPurchaseFreditError.innerHTML = ''
    dataCashout.innerHTML = user.value.toFixed(2) + ' x .8 = ' + (user.value * .8).toFixed(2) + '$'
    dataCashoutError.innerHTML = ''
    dataPurchaseExpenseError.innerHTML = ''

    dataFG.innerHTML = ''
    for (const key in fg) dataFG.innerHTML += key + ': ' + fg[key].toFixed(2) + ', '

    // profile
    dataUserStats.innerHTML = ''
    for (const key in user) dataUserStats.innerHTML += typeof user[key] == 'string' ?
        key + ': ' + user[key] + ', ' :
        key + ': ' + parseFloat(user[key].toFixed(2)) + ', '
}

addEventListener('keyup', updateUI)
addEventListener('mouseup', updateUI)







// discover
class Game {
    constructor(title) {
        this.title = title
        this.fredits = 0
        this.value = 0
        this.owner = user

        this.div = document.createElement('div')
        this.updateText()
        this.div.classList.add('game')
        this.div.addEventListener('click', e => {
            for (const game of Game.all) game.div.classList.remove('selectedGame')
            this.div.classList.add('selectedGame')
            Game.selected = this
        })
        catalog.append(this.div)

        Game.all.push(this)
    }

    updateText() {
        this.div.innerHTML = `${this.title} by ${this.owner.name}, generated: ${this.fredits}F 
            ${parseFloat((this.value).toFixed(3))}$`
    }

    static selected = null
    static all = []
}

function uploadGame(titleParam) {
    const title = titleParam ?? inGameTitle.value
    if (!title) dataUploadGameError.innerHTML = 'No title'
    else new Game(title)
}

function playGame(title, duration) {

    for (const game of Game.all) if (title == game.title) game.div.click()

    if (!Game.selected) { dataPlayGameError.innerHTML = 'No game seleced'; return }
    else if (!duration && !+inPlayDuration.value) { dataPlayGameError.innerHTML = 'No duration'; return }
    // else if (Game.selected.owner == user) { dataPlayGameError.innerHTML = 'Cant play own game'; return }

    const playCost = 10
    const costF = (duration ?? inPlayDuration.value) / playCost
    const cost$ = user.value / user.fredits * costF

    if (costF > user.fredits) dataPlayGameError.innerHTML = 'Not enouF'
    else {

        user.fredits -= costF
        user.value -= cost$
        user.xp += costF

        Game.selected.fredits += costF
        Game.selected.value += cost$
        Game.selected.owner.fredits += costF
        Game.selected.owner.value += cost$
        Game.selected.updateText()

        updateUI()
    }
}

inGameTitle.addEventListener('keydown', e => e.key == 'Enter' && uploadGame())
inUploadGame.addEventListener('click', e => uploadGame())
inPlayGame.addEventListener('click', e => playGame())








// ads
class Batch {
    constructor(adAmount, adDuration, costF, cost$) {
        this.adAmount = adAmount
        this.adDuration = adDuration
        this.costF = costF
        this.cost$ = cost$

        this.owner = user
        this.id = Batch.all.length + 1
        this.timesWatched = 0
        this.value1AD = cost$ / costF * adDuration

        this.div = document.createElement('div')
        this.updateDiv()
        adQ.append(this.div)

        Batch.all.push(this)
    }

    updateDiv() {
        this.div.innerHTML = ` ${this.id} by: ${this.owner.name}, viewTarget: ${this.timesWatched}/${this.adAmount}, 
            earn: ${this.adDuration}F & ${parseFloat(this.value1AD.toFixed(3))}$`
    }

    static all = []
}

function purchaseAD(amount, duration) {
    if (!amount && !+dataAdCost.innerHTML) { dataPurchaseAdError.innerHTML = 'Huh?'; return }

    const adAmount = amount ?? parseInt(inAdAmount.value)
    const adDuration = duration ?? parseInt(inAdDuration.value)
    const costF = adAmount * adDuration
    const cost$ = user.value / user.fredits * costF

    if (costF > user.fredits) dataPurchaseAdError.innerHTML = 'Out of fredits'
    else {
        user.fredits -= costF
        user.value -= cost$

        new Batch(adAmount, adDuration, costF, cost$)

        updateUI()
    }
}

function watchAD(amount) {

    for (let i = 0; i < (amount ?? 1); i++) {
        const batch = Batch.all[0]
        if (!batch) {
            dataWatchAdError.innerHTML = 'No ads :('
            return
        }

        if (++batch.timesWatched == batch.adAmount) {
            batch.div.remove()
            Batch.all.shift()
        } else {
            batch.updateDiv()
            adQ.append(batch.div)
            Batch.all.push(Batch.all.shift())
        }

        user.fredits += batch.adDuration
        user.value += batch.value1AD
    }

    updateUI()
}

inPurchaseAd.addEventListener('click', e => purchaseAD())
inWatchAd.addEventListener('click', e => watchAD())









// fredits
const fg = {
    revenue: 0,
    balance: 0,
    owed: 0,
    profit: 0,
    expenses: 0,
}

function purchaseFredits(amount, value) {
    if (!amount && !+dataFreditCost.innerHTML) { dataPurchaseFreditError.innerHTML = 'Huh?'; return }

    const amountF = amount ?? parseInt(inFreditAmount.value)
    const value1F = value ?? inFreditValue.value
    const cost$ = amountF * value1F


    user.fredits += amountF
    user.value += cost$

    fg.revenue += cost$
    fg.balance += cost$
    fg.profit += cost$ * .2
    fg.owed += cost$ * .8

    updateUI()
}

function cashout() {
    const devsCut = user.value * .8
    if (!user.fredits) { dataCashoutError.innerHTML = 'You\'re broke!'; return }
    else if (devsCut > fg.balance) { dataCashoutError.innerHTML = 'FG is broke!'; return }

    user.cashed += devsCut
    user.fredits = 0
    user.value = 0

    fg.balance -= devsCut
    fg.owed -= devsCut

    updateUI()
}

function spend(amount) {
    const expenses = amount ?? +inExpenseAmount.value
    if (!expenses) { dataPurchaseExpenseError.innerHTML = '...'; return }
    else if (expenses > fg.balance) { dataPurchaseExpenseError.innerHTML = 'Too Expensive'; return }

    fg.balance -= expenses
    fg.expenses += expenses

    updateUI()
}

inPurchaseFredits.addEventListener('click', e => purchaseFredits())
inCashout.addEventListener('click', e => cashout())
inPurchaseExpense.addEventListener('click', e => spend())








// profile
let user = {}

class Profile {
    constructor(name) {
        this.name = name
        this.fredits = 0
        this.value = 0
        this.xp = 0
        this.cashed = 0

        Profile.all.push(this)
        Profile.allNames.push(this.name)
    }

    static all = []
    static allNames = []
}

function regLog(name) {
    if (!name || name == user.name) return

    // register
    if (!Profile.allNames.includes(name)) {
        new Profile(name)

        const newProfileOption = document.createElement('option')
        newProfileOption.value = newProfileOption.text = name
        inSelectProfile.add(newProfileOption)
    }

    // login
    for (const profile of Profile.all) if (profile.name == name) {
        for (const option of inSelectProfile.options)
            if (option.value == name) inSelectProfile.selectedIndex = option.index

        user = profile

        updateUI()
    }
}

inRegLog.addEventListener('click', e => regLog(inProfileName.value))
inProfileName.addEventListener('keydown', e => e.key == 'Enter' && regLog(inProfileName.value))
inSelectProfile.addEventListener('change', e => regLog(inSelectProfile.value))







// Prefabs
function example1() {
    // Example 1: General Fredit Flow
    // The fredits, and thus money, flows from the advertiser, through the gamers, towards the gamedevs.

    // A = advertiser, D = game developer, G = gamer
    // X = all, X1 = one particular

    regLog('A')
    purchaseFredits(11000, 0.01)
    purchaseAD(360, 30)

    regLog('D1')
    uploadGame('Game1')

    regLog('D2')
    uploadGame('Game2')

    regLog('G1')
    watchAD(50)
    playGame('Game1', 60 * 60 * 1)
    playGame('Game2', 60 * 60 * 2)

    regLog('G2')
    watchAD(100)
    playGame('Game1', 60 * 60 * 2)
    playGame('Game2', 60 * 60 * 4)

    regLog('G3')
    watchAD(200)
    playGame('Game1', 60 * 60 * 4)
    playGame('Game2', 60 * 60 * 8)

    regLog('D1')
    cashout()

    regLog('D2')
    cashout()

}

function example2() {
    // Example 2: Fluctuating Fredit Prices
    // The fredit system holds up during fluctuating ad prices, the constant (1F = 1sAD | 10sPlay) is unaffected.
    // So, the gamers won't even notice.


    // January
    regLog('A')
    purchaseFredits(10000, 0.001) // low price
    purchaseAD(1000, 10)

    regLog('D1')
    uploadGame('Game1')

    regLog('G')
    watchAD(1000)
    playGame('Game1', 100000)

    regLog('D1')
    cashout()


    // February
    regLog('A')
    purchaseFredits(10000, 0.01) // mid price
    purchaseAD(1000, 10)

    regLog('D2')
    uploadGame('Game2')

    regLog('G')
    watchAD(1000)
    playGame('Game2', 100000)

    regLog('D2')
    cashout()


    // March
    regLog('A')
    purchaseFredits(10000, 0.1) // high price
    purchaseAD(1000, 10)

    regLog('D3')
    uploadGame('Game3')

    regLog('G')
    watchAD(1000)
    playGame('Game3', 100000)

    regLog('D3')
    cashout()

}

function example3(isFuture) {
    // Example 3: Business Expenses
    // Fredits tend to get 'stuck' in user accounts and it could take a while before a dev finally redeems them. 
    // This in theory means FG could make business investments to the point of having a lower balance than what's 
    // owed to the developers. So, FG's expenses could be higher than its current profits.


    regLog('A')
    purchaseFredits(5000, 0.01) // 50 bucks goes in.
    purchaseAD(500, 10)

    regLog('D')
    uploadGame('Game1')

    regLog('G')
    watchAD(250)
    playGame('Game1', 25000)

    // current profits are 10, but more can be spend due to the future projection.
    spend(20)

    if (isFuture) {

        regLog('G')
        watchAD(250)
        playGame('Game1', 25000)

        // and by this time new fredits get bought

        regLog('A')
        purchaseFredits(5001, 0.01)
        purchaseAD(500, 10)

        regLog('D')
        cashout()

        // regLog('G')
        // watchAD(500)
        // playGame('Game1', 50000)

        // regLog('D')
        // cashout()
    }
}


// init


// example1()
// example2()
// example3(0)

regLog('Guest')

goto(home)
// goto(discover)
// goto(ad)
// goto(fredit)
// goto(profile)





// auto reload
// addEventListener('focus', e => setTimeout(() => location.reload(), 150))

