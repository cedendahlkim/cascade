# Task: gen-rec-sum_digits-2823 | Score: 100% | 2026-02-13T09:20:43.090711

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)