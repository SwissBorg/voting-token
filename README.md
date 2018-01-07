# Voting Token based polling system

The system shall allow :

* creation of a poll specific token
* distribution of the token to poll participants
* setup a reward pot in ETH
* reward poll participants with a share of the reward equal to their share of the total token supply
* leave any unclaimed rewards in the pot (if tokens are left unused, then not all the rewards will be distributed)
* stop the poll at any time
* retrieve the reward pot by the owner
* create as many question addresses as the owner wishes

## Principles

Explaining the principles of the system and scope definition

### Voting mechanism

Each poll question is a unique Ethereum address. Users show their preference for a question 
by sending their tokens to it. The poll creator has to provide an option like `none of the above` 
if they want to enable participants to vote blank.

### Poll creation

Only one poll can exist at any one time. Creating a new one will archive the existing one. 
Old polls can be reactivated by setting them as the active poll.

Creating a poll consist of giving it a unique identifier and adding questions to it. 
All questions will be added to the currently active poll.

A question consists only of an address. The description of the question must be provided 
in an accompanying web-page. This web-page should also display the addresses for the 
questions to allow users to easily send their tokens there.

### Token transfer and voting

Voting is performed by transfering the voting tokens to a specific question.
The amount of voting rights for each user is directly dependent on the number of tokens
they hold.

There are two ways to allow someone to vote on another user's behalf:

1. transfer them your tokens
1. allow them to transfer your tokens on your behalf

#### Proxy votes by transfer

If a user sends their token to another user, the PollToken will not record the original owner 
and consider the new owner to have been given the tokens and be their rightful owner. They 
will get the rewards from the voting operation and all the rights that come with holding a token. 
Namly: transfer the token and grant someone permission to transfer the token on their behalf.

#### Proxy votes by permission
 
If a user gives another user an allowance to transfer token on their behalf (use the 
`transferFrom` function of the contract) the only target allowed is a question in the active poll.

The reward in this scenario goes to the token holder and not the proxy.

The restriction on the transfer target is to avoid the scenario where a user grants another 
user for proxy voting and the proxy sends the tokens to themselves before participating in 
the vote, thus reaping the reward that comes from participation in the poll.

### Closing a poll

The PollToken contract is stoppable. This means that the owner can call the `stop` function 
on it and it will not be possible to transfer tokens anymore. The effect being that the 
users will not be able to claim participation rewards anymore.

### Poll management

The pollId is a 32 bytes string which allows to uniquely identify a poll. All the data like 
balances and questions are linked to the pollId. 

#### Creating a new poll

The creation of a new poll is done by using the `addPoll` function. This will create a neww unique 
poll id based on the block hash of the block in which the call is created.

#### Going back to a previous poll

By using the `setPoll` function with a previously used pollId it is possible to go back to 
the state of this poll. Balances and questions will be reset to previous values but the reward 
pot will not be reset.

This means that if the owner resets the state to a previous poll and starts the poll by calling 
the `start` function. The participants with remaining tokens will be able to claim a share of 
the currently available reward pot. This is porbably not a good idea and should be avoided 
unless explicitly required.

## Functions

The public functions of the contract are listed here as well as their usage.