# Task: gen-rec-sum_digits-1720 | Score: 100% | 2026-02-13T12:03:13.421592

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)