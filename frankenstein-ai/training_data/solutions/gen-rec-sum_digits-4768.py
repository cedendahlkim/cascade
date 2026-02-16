# Task: gen-rec-sum_digits-4768 | Score: 100% | 2026-02-15T08:24:08.660552

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)