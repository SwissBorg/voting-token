# Voting Token based polling system

### Voting mechanism

Each poll question is a unique Ethereum address. Users show their preference for a question 
by sending their tokens to it. The poll creator has to provide an option like `none of the above` 
if they want to enable participants to vote blank.

### Token transfer and voting

Voting is performed by transfering the voting tokens to a specific question.
The amount of voting rights for each user is directly dependent on the number of tokens
they hold.

There are two ways to allow someone to vote on another user's behalf:

1. transfer them your tokens
2. allow them to transfer your tokens on your behalf

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
