# Task: gen-sim-bank_transactions-7587 | Score: 100% | 2026-02-15T10:50:51.327586

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