# Task: gen-greedy-coin_greedy-5882 | Score: 100% | 2026-02-17T20:34:21.829471

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