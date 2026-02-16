# Task: gen-rec-sum_digits-2627 | Score: 100% | 2026-02-13T14:42:13.273409

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)