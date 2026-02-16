# Task: gen-rec-sum_digits-7723 | Score: 100% | 2026-02-15T08:36:23.379120

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)