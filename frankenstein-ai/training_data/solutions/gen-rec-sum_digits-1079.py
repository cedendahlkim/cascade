# Task: gen-rec-sum_digits-1079 | Score: 100% | 2026-02-15T08:36:22.593560

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)