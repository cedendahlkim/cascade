# Task: gen-sim-bank_transactions-9596 | Score: 100% | 2026-02-13T18:37:41.779200

S = int(input())
N = int(input())
rejected = 0
for _ in range(N):
    line = input().split()
    op = line[0]
    amount = int(line[1])
    if op == 'D':
        S += amount
    elif op == 'W':
        if amount <= S:
            S -= amount
        else:
            rejected += 1
print(S, rejected)