# Task: gen-rec-sum_digits-8333 | Score: 100% | 2026-02-13T17:36:14.912816

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)