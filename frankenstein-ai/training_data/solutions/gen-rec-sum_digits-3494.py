# Task: gen-rec-sum_digits-3494 | Score: 100% | 2026-02-13T21:08:23.462165

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)