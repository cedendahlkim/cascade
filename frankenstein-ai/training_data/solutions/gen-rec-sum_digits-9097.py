# Task: gen-rec-sum_digits-9097 | Score: 100% | 2026-02-13T11:23:16.026643

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)