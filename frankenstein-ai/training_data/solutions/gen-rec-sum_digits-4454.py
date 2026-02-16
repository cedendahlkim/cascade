# Task: gen-rec-sum_digits-4454 | Score: 100% | 2026-02-13T13:47:26.635462

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)