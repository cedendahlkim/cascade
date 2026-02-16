# Task: gen-rec-sum_digits-3092 | Score: 100% | 2026-02-13T20:50:18.891098

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)