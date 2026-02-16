# Task: gen-greedy-coin_greedy-4341 | Score: 100% | 2026-02-15T07:59:10.987976

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