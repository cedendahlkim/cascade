# Task: gen-rec-sum_digits-1791 | Score: 100% | 2026-02-13T18:33:45.704260

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)