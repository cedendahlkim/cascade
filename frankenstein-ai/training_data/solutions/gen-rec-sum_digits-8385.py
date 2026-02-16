# Task: gen-rec-sum_digits-8385 | Score: 100% | 2026-02-15T08:24:25.560639

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)