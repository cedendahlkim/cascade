# Task: gen-greedy-coin_greedy-5757 | Score: 100% | 2026-02-13T21:08:38.187840

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