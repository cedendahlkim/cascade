# Task: gen-greedy-coin_greedy-7626 | Score: 100% | 2026-02-13T19:24:25.244842

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