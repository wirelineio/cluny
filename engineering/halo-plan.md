# Halo Wallet Support

## Background

Blockchain wallets such as Metamask and Lunie act as a trusted enclave for one or more private keys that are used to sign blockchain transactions under the direction of a host web application. HALO uses signed messages that function as cryptographic credentials for the purpose of defining authority over access control to a shared database called a Party.
Currentl HALO implementations are monolithic: the application, key management, message signing and verification are all done inside the same trust boundary -- a web page or Node.JS process.

## Goals

The goal for HALO wallet support is to move the key management, message signing and verification functions into a Lunie/Metamask-like browser extension wallet. This achieves two benefits: First, the browser extension offers a higher level of trustworthiness than web page code. Second, web apps loaded from different hosts may share the same keys and other context via the browser extension.

## Motivating Examples

 1. User onboarding/account/identity creation process is unified between HALO and WNS.
 1. User invites a Bot to join a party: wallet pops up requesting user approve the invitation.
 1. User's node performs greeting for an invitee to a party: wallet pops up requesting user approve admitting the new party member.
 1. User invites another user to a party: wallet pops up requesting user appove the invitation request. If the app code is subverted a resulting malicious invitation won't be approved.
 
## Spec/Features

Included features:
 1. Single seed phrase across WNS and Halo (verify this has both no privacy implications nor HD key weakness attack issues).
 1. Meaningful approval data display for the user (so they can't be tricked into approving a malicious transaction).
 
Excluded from this release:
 1. ??

## Potential Problems

 1. HD key family shared between blockchain and HALO may have cryptographic weaknesses.
 1. Potentially large amount of code in transitive dependencies of current HALO code.

## Implementation Tasks

 1. Identify classes/files/components in current HALO repo that would need to be ported into the wallet (and their tansitive dependencies).
 1. Identity classes/files/components in current HALO repo that would need to be modified for wallet support.
 
 ## Project Milestones
 
 
 
