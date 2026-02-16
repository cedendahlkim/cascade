# Task: gen-rec-sum_digits-1857 | Score: 100% | 2026-02-13T17:09:15.795672

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)