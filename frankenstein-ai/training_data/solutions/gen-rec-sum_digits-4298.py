# Task: gen-rec-sum_digits-4298 | Score: 100% | 2026-02-15T09:16:59.706452

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)