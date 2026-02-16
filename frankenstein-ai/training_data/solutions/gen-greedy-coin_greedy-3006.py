# Task: gen-greedy-coin_greedy-3006 | Score: 100% | 2026-02-13T21:08:08.571137

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