# Task: gen-greedy-coin_greedy-4025 | Score: 100% | 2026-02-13T18:34:30.400309

amount = int(input())
coins = list(map(int, input().split()))

count = 0
for coin in coins:
    while amount >= coin:
        amount -= coin
        count += 1

if amount == 0:
    print(count)
else:
    print(-1)