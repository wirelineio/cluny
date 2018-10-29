function r(type, pageName) {
  return require(`./components/${type}/Page${pageName}`).default
}

let common = r.bind(null, `common`)
let governance = r.bind(null, `governance`)
let staking = r.bind(null, `staking`)
let wallet = r.bind(null, `wallet`)

export default [
  {
    path: `/governance`,
    name: `Governance`,
    component: governance(`Governance`),
    redirect: `proposals/`,
    children: [
      {
        path: `/proposals`,
        name: `Proposals`,
        component: require(`./components/governance/TabProposals`).default
      }
    ]
  },
  { path: `proposals/new`, component: governance(`ProposalsNew`) },
  { path: `proposals/new/adjust`, component: governance(`ProposalsNewAdjust`) },
  { path: `proposals/new/amend`, component: governance(`ProposalsNewAmend`) },
  { path: `proposals/new/create`, component: governance(`ProposalsNewCreate`) },
  { path: `proposals/new/text`, component: governance(`ProposalsNewText`) },
  {
    path: `proposals/:proposal`,
    name: `proposal`,
    component: governance(`Proposal`)
  },

  // STAKE
  {
    path: `/staking`,
    name: `staking`,
    component: staking(`Staking`),
    redirect: `/staking/my-delegations/`,
    children: [
      {
        path: `my-delegations`,
        name: `My Delegations`,
        component: require(`./components/staking/TabMyDelegations`).default
      },
      {
        path: `Validators`,
        name: `Validators`,
        component: require(`./components/staking/TabValidators`).default
      },
      {
        path: `staking-parameters`,
        name: `Parameters`,
        component: require(`./components/staking/TabParameters`).default
      }
    ]
  },
  {
    path: `/staking/validators/:validator`,
    name: `validator`,
    component: staking(`Validator`)
  },

  {
    path: `/preferences`,
    name: `preferences`,
    component: common(`Preferences`)
  },

  {
    path: `/`,
    name: `wallet`,
    component: wallet(`Wallet`)
  },
  {
    path: `/wallet/send/:denom?`,
    name: `send`,
    props: true,
    component: wallet(`Send`)
  },
  {
    path: `/wallet/transactions`,
    name: `transactions`,
    component: wallet(`Transactions`)
  },

  { path: `/404`, component: common(`404`) },
  { path: `*`, component: common(`404`) }
]
