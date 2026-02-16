# Task: gen-greedy-coin_greedy-1625 | Score: 100% | 2026-02-15T12:03:28.399845

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