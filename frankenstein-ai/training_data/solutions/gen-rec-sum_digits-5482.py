# Task: gen-rec-sum_digits-5482 | Score: 100% | 2026-02-13T17:36:05.701684

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)