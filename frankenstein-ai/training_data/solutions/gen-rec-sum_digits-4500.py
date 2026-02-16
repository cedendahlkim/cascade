# Task: gen-rec-sum_digits-4500 | Score: 100% | 2026-02-15T08:24:27.058412

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)