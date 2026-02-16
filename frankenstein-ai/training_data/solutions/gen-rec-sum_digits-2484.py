# Task: gen-rec-sum_digits-2484 | Score: 100% | 2026-02-13T16:07:13.086534

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)