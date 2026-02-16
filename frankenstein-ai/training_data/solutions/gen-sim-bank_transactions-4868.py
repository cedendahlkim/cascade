# Task: gen-sim-bank_transactions-4868 | Score: 100% | 2026-02-14T12:47:38.892664

s = int(input())
n = int(input())
rejected = 0
for _ in range(n):
    line = input().split()
    op = line[0]
    amount = int(line[1])
    if op == 'D':
        s += amount
    elif op == 'W':
        if amount <= s:
            s -= amount
        else:
            rejected += 1
print(s, rejected)