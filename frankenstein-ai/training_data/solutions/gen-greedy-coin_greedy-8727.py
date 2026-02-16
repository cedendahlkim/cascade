# Task: gen-greedy-coin_greedy-8727 | Score: 100% | 2026-02-15T07:48:42.440102

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