# Task: gen-rec-sum_digits-4525 | Score: 100% | 2026-02-15T10:10:10.675501

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)