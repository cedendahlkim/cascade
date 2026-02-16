# Task: gen-rec-sum_digits-7298 | Score: 100% | 2026-02-13T17:09:14.880942

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)