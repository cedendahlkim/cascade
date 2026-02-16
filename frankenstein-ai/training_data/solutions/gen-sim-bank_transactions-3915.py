# Task: gen-sim-bank_transactions-3915 | Score: 100% | 2026-02-14T12:13:04.909313

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