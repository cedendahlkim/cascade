# Task: gen-sim-bank_transactions-8216 | Score: 100% | 2026-02-14T12:20:10.527645

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