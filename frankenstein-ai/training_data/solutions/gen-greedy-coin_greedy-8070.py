# Task: gen-greedy-coin_greedy-8070 | Score: 100% | 2026-02-14T12:27:52.461619

amount = int(input())
coins = list(map(int, input().split()))

count = 0
remaining = amount

for coin in coins:
    while remaining >= coin:
        remaining -= coin
        count += 1

if remaining == 0:
    print(count)
else:
    print(-1)